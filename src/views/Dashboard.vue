<script setup>
import { ref, onMounted, computed } from 'vue'
import { getProfile, getAttempts } from '../lib/storage'

const profile = ref(getProfile())
const standards = ref([])
const attempts = ref(getAttempts())

const subjects = computed(() => {
  const bySubject = {}
  for (const s of standards.value) {
    if (!bySubject[s.subject]) bySubject[s.subject] = []
    bySubject[s.subject].push(s)
  }
  return bySubject
})

function accuracyFor(subject) {
  const rows = attempts.value.filter((a) => a.subject === subject)
  if (!rows.length) return null
  const correct = rows.filter((a) => a.isCorrect).length
  return Math.round((correct / rows.length) * 100)
}

onMounted(async () => {
  const res = await fetch('/study-data/standards.json')
  standards.value = await res.json()
})
</script>

<template>
  <section>
    <h1>{{ profile?.name }}님, 오늘도 화이팅</h1>
    <div class="subject-grid">
      <RouterLink
        v-for="(units, subject) in subjects"
        :key="subject"
        :to="{ name: 'subject-units', params: { subject } }"
        class="subject-card"
      >
        <h2>{{ subject }}</h2>
        <p>{{ units.length }}개 단원</p>
        <p v-if="accuracyFor(subject) !== null" class="accuracy">
          정답률 {{ accuracyFor(subject) }}%
        </p>
        <p v-else class="accuracy muted">아직 기록 없음</p>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.subject-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
  margin-top: 20px;
}
.subject-card {
  display: block;
  padding: 18px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
}
.subject-card h2 {
  margin: 0 0 6px;
}
.subject-card p {
  margin: 2px 0;
  font-size: 0.85rem;
  color: #6b7280;
}
.accuracy {
  font-weight: 600;
  color: #3f7a4d;
}
.accuracy.muted {
  color: #9ca3af;
  font-weight: 400;
}
</style>
