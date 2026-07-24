<script setup>
import { ref, onMounted, computed } from 'vue'
import { getAiSettings, addAttempt, addWrongNote, getAttempts, getWrongNotes } from '../lib/storage'
import { askAdvice, generateSimilarQuestion, buildWeaknessReport } from '../lib/aiProviders'

const props = defineProps({ standardId: String })

const question = ref(null)
const selected = ref(null)
const submitted = ref(false)
const aiText = ref('')
const aiBusy = ref(false)
const aiError = ref('')
const similarQuestion = ref(null)

const isCorrect = computed(() => submitted.value && selected.value === question.value?.answer)

onMounted(async () => {
  const res = await fetch('/study-data/questions/sample.json')
  const all = await res.json()
  question.value = all.find((q) => q.standardId === props.standardId) ?? null
})

function submit() {
  if (!selected.value || !question.value) return
  submitted.value = true
  const correct = selected.value === question.value.answer
  addAttempt({
    subject: question.value.subject,
    standardId: props.standardId,
    questionId: question.value.id,
    isCorrect: correct,
  })
  if (!correct) {
    addWrongNote({
      subject: question.value.subject,
      standardId: props.standardId,
      questionId: question.value.id,
      lastSelected: selected.value,
    })
  }
}

async function runAdvice() {
  await withAi('advice', () =>
    askAdvice({
      aiSettings: getAiSettings(),
      subject: question.value.subject,
      standardTitle: props.standardId,
      recentAttempts: getAttempts().filter((a) => a.standardId === props.standardId),
    }),
  )
}

async function runWeaknessReport() {
  await withAi('report', () =>
    buildWeaknessReport({
      aiSettings: getAiSettings(),
      subject: question.value.subject,
      attempts: getAttempts().filter((a) => a.subject === question.value.subject),
      wrongNotes: getWrongNotes().filter((n) => n.subject === question.value.subject),
    }),
  )
}

async function runSimilarQuestion() {
  aiBusy.value = true
  aiError.value = ''
  similarQuestion.value = null
  try {
    similarQuestion.value = await generateSimilarQuestion({
      aiSettings: getAiSettings(),
      sourceQuestion: question.value,
    })
  } catch (e) {
    aiError.value = e.message
  } finally {
    aiBusy.value = false
  }
}

async function withAi(_kind, run) {
  aiBusy.value = true
  aiError.value = ''
  aiText.value = ''
  try {
    aiText.value = await run()
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
    <h1>{{ standardId }}</h1>

    <div v-if="!question" class="empty">
      아직 이 단원에는 자체 제작 문항이 없어요. <code>public/study-data/questions/</code>에 추가해 주세요.
    </div>

    <div v-else class="question">
      <p class="prompt">{{ question.question }}</p>
      <label v-for="(text, key) in question.choices" :key="key" class="choice">
        <input type="radio" :value="key" v-model="selected" :disabled="submitted" />
        {{ key }}. {{ text }}
      </label>
      <button v-if="!submitted" :disabled="!selected" @click="submit">제출</button>

      <div v-if="submitted" class="result" :class="{ correct: isCorrect, wrong: !isCorrect }">
        <p>{{ isCorrect ? '정답이에요!' : `오답이에요. 정답은 ${question.answer}번.` }}</p>
        <p class="explanation">{{ question.explanation }}</p>

        <div class="ai-actions">
          <button @click="runAdvice" :disabled="aiBusy">AI 조언 받기</button>
          <button @click="runSimilarQuestion" :disabled="aiBusy">유사 문항 생성</button>
          <button @click="runWeaknessReport" :disabled="aiBusy">약점 리포트</button>
        </div>

        <p v-if="aiBusy" class="muted">AI 응답을 기다리는 중...</p>
        <p v-if="aiError" class="error">{{ aiError }}</p>
        <p v-if="aiText" class="ai-text">{{ aiText }}</p>

        <div v-if="similarQuestion" class="similar">
          <h3>생성된 유사 문항</h3>
          <p>{{ similarQuestion.question }}</p>
          <ul>
            <li v-for="(text, key) in similarQuestion.choices" :key="key">{{ key }}. {{ text }}</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.question {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.prompt {
  font-weight: 600;
}
.choice {
  display: flex;
  gap: 8px;
  align-items: center;
}
button {
  align-self: flex-start;
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
.result {
  margin-top: 8px;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
}
.result.correct {
  border-color: #3f7a4d;
}
.result.wrong {
  border-color: #a13a3a;
}
.explanation {
  color: #6b7280;
  font-size: 0.9rem;
}
.ai-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
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
.similar {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #d1d5db;
}
</style>
