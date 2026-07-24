import { canCallAiToday, recordAiCall } from './storage'

const DEFAULT_MODELS = {
  gemini: 'gemini-2.0-flash',
  openai: 'gpt-4o-mini',
  claude: 'claude-haiku-4-5-20251001',
}

const CURRICULUM_CONTEXT =
  '이 학생은 2015 개정 교육과정을 적용받는 중학교 3학년이다. 2015 개정 교육과정 범위를 벗어나는 내용(예: 2022 개정에서 추가되거나 이동된 단원, 고등학교 과정)은 언급하지 않는다.'

const MATH_NOTATION_RULE =
  '수식에서 거듭제곱을 쓸 때 "^2"처럼 캐럿(^)으로 쓰지 말고, 실제 위첨자 문자(², ³, ⁴ 등)를 그대로 사용한다.'

async function callGemini({ apiKey, model, systemPrompt, userPrompt }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    }),
  })
  if (!res.ok) throw new Error(await describeError(res))
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? ''
}

async function callOpenAi({ apiKey, model, systemPrompt, userPrompt }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })
  if (!res.ok) throw new Error(await describeError(res))
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function callClaude({ apiKey, model, systemPrompt, userPrompt }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })
  if (!res.ok) throw new Error(await describeError(res))
  const data = await res.json()
  return data.content?.map((c) => c.text).join('') ?? ''
}

async function describeError(res) {
  if (res.status === 401 || res.status === 403) {
    return 'API 키가 올바르지 않습니다. 설정에서 키를 다시 확인해 주세요.'
  }
  if (res.status === 429) {
    return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.'
  }
  const detail = await res
    .clone()
    .json()
    .then((body) => body.error?.message ?? body.message)
    .catch(() => null)
  return detail
    ? `AI 호출에 실패했습니다 (상태 코드 ${res.status}): ${detail}`
    : `AI 호출에 실패했습니다 (상태 코드 ${res.status}).`
}

const CALLERS = { gemini: callGemini, openai: callOpenAi, claude: callClaude }

async function callAi({ aiSettings, systemPrompt, userPrompt, kind }) {
  if (!aiSettings?.provider || !aiSettings?.apiKey) {
    throw new Error('설정에서 AI Provider와 API 키를 먼저 저장해 주세요.')
  }
  if (!canCallAiToday()) {
    throw new Error('오늘의 AI 호출 횟수 한도를 넘었습니다. 내일 다시 시도해 주세요.')
  }
  const caller = CALLERS[aiSettings.provider]
  const model = aiSettings.model || DEFAULT_MODELS[aiSettings.provider]
  const text = await caller({ apiKey: aiSettings.apiKey, model, systemPrompt, userPrompt })
  recordAiCall(kind)
  return text
}

export async function askAdvice({ aiSettings, subject, standardTitle, recentAttempts }) {
  const systemPrompt = `너는 항공과학고 2차 시험(국어/영어/수학) 준비를 돕는 학습 코치다. ${CURRICULUM_CONTEXT} ${MATH_NOTATION_RULE} 짧고 구체적인 한국어로 답한다.`
  const stats = summarizeAttempts(recentAttempts)
  const userPrompt = `과목: ${subject}\n단원: ${standardTitle}\n최근 풀이 통계: ${stats}\n이 학생에게 지금 필요한 학습 조언을 3문장 이내로 알려줘.`
  return callAi({ aiSettings, systemPrompt, userPrompt, kind: 'advice' })
}

export async function generateSimilarQuestion({ aiSettings, sourceQuestion, standardTitle }) {
  const systemPrompt = `너는 중학교 시험 문제를 만드는 출제자다. ${CURRICULUM_CONTEXT} ${MATH_NOTATION_RULE} 반드시 JSON만 출력하고 다른 텍스트는 쓰지 않는다.`
  const userPrompt = `아래 문항과 같은 형식(같은 필드: id, standardId, subject, type, question, choices, answer, explanation)으로, "${standardTitle}" 단원·같은 난이도의 새 문항 1개를 JSON으로 만들어줘. 원문항을 그대로 베끼지 말고 숫자나 조건을 바꿔줘.

이차함수나 일차함수 그래프가 문제를 이해하는 데 도움이 되는 경우에만, 아래 형식으로 "graph" 필드를 추가해라. 필요 없으면 graph 필드를 넣지 마라.
- 이차함수(y = ax² + bx + c): {"type":"quadratic","a":숫자,"b":숫자,"c":숫자}
- 일차함수(y = mx + b): {"type":"linear","m":숫자,"b":숫자}
graph 필드에는 반드시 숫자만 쓰고, 수식 문자열이나 다른 형식은 쓰지 마라.

원문항: ${JSON.stringify(sourceQuestion)}`
  const text = await callAi({ aiSettings, systemPrompt, userPrompt, kind: 'similar-question' })
  return parseQuestionJson(text)
}

export async function buildWeaknessReport({ aiSettings, subject, attempts, wrongNotes }) {
  const systemPrompt = `너는 시험 대비 약점을 진단하는 코치다. ${CURRICULUM_CONTEXT} 통계를 근거로 다음에 무엇을 공부해야 하는지 구체적으로 짧게 말한다.`
  const stats = summarizeAttempts(attempts)
  const userPrompt = `과목: ${subject}\n전체 풀이 통계: ${stats}\n오답 개수: ${wrongNotes.length}\n이 학생의 약점과 다음 학습 방향을 3~4문장으로 진단해줘.`
  return callAi({ aiSettings, systemPrompt, userPrompt, kind: 'weakness-report' })
}

function summarizeAttempts(attempts = []) {
  if (!attempts.length) return '아직 풀이 기록 없음'
  const correct = attempts.filter((a) => a.isCorrect).length
  return `총 ${attempts.length}문항 중 ${correct}문항 정답 (정답률 ${Math.round((correct / attempts.length) * 100)}%)`
}

function parseQuestionJson(text) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI가 올바른 문항 형식을 반환하지 않았습니다.')
  const parsed = JSON.parse(match[0])
  if (!parsed.question || !parsed.choices || !parsed.answer) {
    throw new Error('생성된 문항에 필수 필드가 없습니다.')
  }
  if (parsed.graph && !isValidGraph(parsed.graph)) {
    delete parsed.graph
  }
  return parsed
}

function isValidGraph(graph) {
  if (graph.type === 'quadratic') {
    return [graph.a, graph.b, graph.c].every((n) => typeof n === 'number' && Number.isFinite(n))
  }
  if (graph.type === 'linear') {
    return [graph.m, graph.b].every((n) => typeof n === 'number' && Number.isFinite(n))
  }
  return false
}
