<script setup>
import { ref, onMounted, computed } from 'vue'

const props = defineProps({ subject: String })
const standards = ref([])

const units = computed(() => standards.value.filter((s) => s.subject === props.subject))

onMounted(async () => {
  const res = await fetch('/study-data/standards.json')
  standards.value = await res.json()
})
</script>

<template>
  <section>
    <RouterLink to="/">← 대시보드</RouterLink>
    <h1>{{ subject }}</h1>
    <ul class="unit-list">
      <li v-for="u in units" :key="u.id" class="unit-row">
        <RouterLink :to="{ name: 'exam-paper', params: { standardId: u.id } }" class="unit-main">
          {{ u.grade }} — {{ u.title }}
        </RouterLink>
        <RouterLink :to="{ name: 'problem-solve', params: { standardId: u.id } }" class="unit-secondary">
          한 문제만 풀기
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.unit-list {
  list-style: none;
  padding: 0;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.unit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 4px 6px 4px 14px;
}
.unit-main {
  flex: 1;
  padding: 10px 0;
  text-decoration: none;
  color: inherit;
  font-weight: 600;
}
.unit-secondary {
  font-size: 0.78rem;
  color: #8a5716;
  text-decoration: none;
  padding: 6px 10px;
  border-radius: 4px;
  white-space: nowrap;
}
.unit-secondary:hover {
  background: #f1ede1;
}
</style>
