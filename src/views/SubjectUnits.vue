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
      <li v-for="u in units" :key="u.id">
        <RouterLink :to="{ name: 'problem-solve', params: { standardId: u.id } }">
          {{ u.grade }} — {{ u.title }}
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
.unit-list a {
  display: block;
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  text-decoration: none;
  color: inherit;
}
</style>
