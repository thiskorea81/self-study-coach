<script setup>
import { ref, onMounted, computed } from 'vue'
import { getAiSettings, addAttempt, addWrongNote } from '../lib/storage'
import { buildWeaknessReport } from '../lib/aiProviders'
import { formatMathText } from '../lib/mathText'
import FunctionGraph from '../components/FunctionGraph.vue'

const props = defineProps({ standardId: String })

const questions = ref([])
const standard = ref(null)
const currentIndex = ref(0)
const answers = ref({})
const submitted = ref(false)
const aiText = ref('')
const aiBusy = ref(false)
const aiError = ref('')

const standardTitle = computed(() =>
  standard.value ? `${standard.value.subject} · ${standard.value.grade} — ${standard.value.title}` : props.standardId,
)
const current = computed(() => questions.value[currentIndex.value] ?? null)
const answeredCount = computed(() => Object.keys(answers.value).length)
const allAnswered = computed(() => questions.value.length > 0 && answeredCount.value === questions.value.length)

const results = computed(() => {
  if (!submitted.value) return null
  const byCode = {}
  const wrongList = []
  let correctCount = 0
  for (const q of questions.value) {
    const picked = answers.value[q.id]
    const isCorrect = picked === q.answer
    if (isCorrect) correctCount++
    const code = q.achievementCode ?? '기타'
    byCode[code] ??= { code, total: 0, correct: 0 }
    byCode[code].total++
    if (isCorrect) byCode[code].correct++
    if (!isCorrect) wrongList.push({ ...q, picked })
  }
  const codeNames = Object.fromEntries((standard.value?.achievementStandards ?? []).map((s) => [s.code, s.name]))
  return {
    total: questions.value.length,
    correctCount,
    percent: Math.round((correctCount / questions.value.length) * 100),
    byCode: Object.values(byCode).map((c) => ({ ...c, name: codeNames[c.code] ?? '' })),
    wrongList,
  }
})

onMounted(async () => {
  const [questionsRes, standardsRes] = await Promise.all([
    fetch(`/study-data/questions/${props.standardId}.json`),
    fetch('/study-data/standards.json'),
  ])
  questions.value = questionsRes.ok ? shuffle(await questionsRes.json()) : []
  const standards = await standardsRes.json()
  standard.value = standards.find((s) => s.id === props.standardId) ?? null
})

function shuffle(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function select(key) {
  if (submitted.value) return
  answers.value = { ...answers.value, [current.value.id]: key }
}

function goTo(i) {
  currentIndex.value = i
}

function submitExam() {
  for (const q of questions.value) {
    const picked = answers.value[q.id]
    const correct = picked === q.answer
    addAttempt({ subject: q.subject, standardId: props.standardId, questionId: q.id, isCorrect: correct })
    if (!correct) {
      addWrongNote({ subject: q.subject, standardId: props.standardId, questionId: q.id, lastSelected: picked })
    }
  }
  submitted.value = true
}

function retake() {
  currentIndex.value = 0
  answers.value = {}
  submitted.value = false
  aiText.value = ''
  aiError.value = ''
  questions.value = shuffle(questions.value)
}

async function runWeaknessReport() {
  aiBusy.value = true
  aiError.value = ''
  aiText.value = ''
  try {
    aiText.value = await buildWeaknessReport({
      aiSettings: getAiSettings(),
      subject: questions.value[0]?.subject,
      attempts: questions.value.map((q) => ({ isCorrect: answers.value[q.id] === q.answer })),
      wrongNotes: results.value.wrongList,
    })
  } catch (e) {
    aiError.value = e.message
  } finally {
    aiBusy.value = false
  }
}
</script>

<template>
  <section>
    <RouterLink to="/">← 대시보드</RouterLink>
    <h1>{{ standardTitle }} — 모의고사</h1>

    <div v-if="!questions.length" class="empty">아직 이 단원에는 문항이 없어요.</div>

    <template v-else-if="!submitted">
      <div class="dots">
        <button
          v-for="(q, i) in questions"
          :key="q.id"
          class="dot"
          :class="{ active: i === currentIndex, answered: answers[q.id] }"
          @click="goTo(i)"
        >
          {{ i + 1 }}
        </button>
      </div>

      <p class="progress">{{ answeredCount }} / {{ questions.length }}문항 답변함</p>

      <div class="question">
        <p class="prompt">{{ formatMathText(current.question) }}</p>
        <FunctionGraph v-if="current.graph" :graph="current.graph" />
        <label v-for="(text, key) in current.choices" :key="key" class="choice">
          <input
            type="radio"
            :name="current.id"
            :value="key"
            :checked="answers[current.id] === key"
            @change="select(key)"
          />
          {{ key }}. {{ formatMathText(text) }}
        </label>
      </div>

      <div class="nav">
        <button :disabled="currentIndex === 0" @click="goTo(currentIndex - 1)">← 이전</button>
        <button v-if="currentIndex < questions.length - 1" @click="goTo(currentIndex + 1)">다음 →</button>
        <button v-else :disabled="!allAnswered" class="submit" @click="submitExam">제출하기</button>
      </div>
      <p v-if="currentIndex === questions.length - 1 && !allAnswered" class="hint">
        아직 답하지 않은 문항이 {{ questions.length - answeredCount }}개 있어요.
      </p>
    </template>

    <template v-else>
      <div class="score-box">
        <p class="score">{{ results.correctCount }} / {{ results.total }}점 ({{ results.percent }}%)</p>
        <ul class="by-code">
          <li v-for="c in results.byCode" :key="c.code">
            <code>{{ c.code }}</code> {{ c.name }} — {{ c.correct }}/{{ c.total }}
          </li>
        </ul>
        <div class="ai-actions">
          <button @click="runWeaknessReport" :disabled="aiBusy">AI 약점 리포트</button>
          <button @click="retake">다시 풀기</button>
        </div>
        <p v-if="aiBusy" class="muted">AI 응답을 기다리는 중...</p>
        <p v-if="aiError" class="error">{{ aiError }}</p>
        <p v-if="aiText" class="ai-text">{{ formatMathText(aiText) }}</p>
      </div>

      <h2 class="review-title">문항별 검토</h2>
      <div v-for="(q, i) in questions" :key="q.id" class="review-item" :class="{ wrong: answers[q.id] !== q.answer }">
        <p class="review-q">{{ i + 1 }}. {{ formatMathText(q.question) }}</p>
        <FunctionGraph v-if="q.graph" :graph="q.graph" />
        <p class="review-answer">
          내 답: {{ answers[q.id] ?? '(무응답)' }}번 · 정답: {{ q.answer }}번
          {{ answers[q.id] === q.answer ? '✓' : '✗' }}
        </p>
        <p class="explanation">{{ formatMathText(q.explanation) }}</p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.dots {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 16px;
}
.dot {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
}
.dot.answered {
  background: #f1ede1;
  border-color: #cbb994;
}
.dot.active {
  border-color: #a8641c;
  border-width: 2px;
}
.progress {
  margin: 10px 0;
  font-size: 0.85rem;
  color: #6b7280;
}
.question {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.prompt {
  font-weight: 600;
  white-space: pre-line;
}
.choice {
  display: flex;
  gap: 8px;
  align-items: center;
}
.nav {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
button {
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  background: #a8641c;
  color: white;
  cursor: pointer;
}
button:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}
button.submit {
  background: #3f7a4d;
}
.hint {
  margin-top: 8px;
  font-size: 0.85rem;
  color: #a13a3a;
}
.score-box {
  margin-top: 16px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #f1ede1;
}
.score {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0 0 10px;
}
.by-code {
  list-style: none;
  padding: 0;
  margin: 0 0 12px;
  font-size: 0.88rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ai-actions {
  display: flex;
  gap: 8px;
}
.muted {
  color: #9ca3af;
}
.error {
  color: #a13a3a;
}
.ai-text {
  white-space: pre-wrap;
  margin-top: 8px;
}
.review-title {
  margin-top: 24px;
  font-size: 1rem;
}
.review-item {
  padding: 12px 0;
  border-top: 1px solid #e2ddd0;
}
.review-item.wrong .review-answer {
  color: #a13a3a;
}
.review-q {
  font-weight: 600;
  white-space: pre-line;
  margin: 0 0 6px;
}
.review-answer {
  font-size: 0.88rem;
  margin: 0 0 4px;
}
.explanation {
  font-size: 0.88rem;
  color: #6b7280;
  margin: 0;
}
</style>
