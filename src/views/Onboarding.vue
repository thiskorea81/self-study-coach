<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { setProfile, setAiSettings } from '../lib/storage'

const router = useRouter()
const name = ref('')
const provider = ref('gemini')
const apiKey = ref('')

function submit() {
  if (!name.value.trim()) return
  setProfile(name.value.trim())
  if (apiKey.value.trim()) {
    setAiSettings({ provider: provider.value, apiKey: apiKey.value.trim() })
  }
  router.push({ name: 'dashboard' })
}
</script>

<template>
  <section class="onboarding">
    <h1>시작하기</h1>
    <p class="hint">
      이름과 AI API 키는 이 브라우저에만 저장돼요. 어디에도 전송되지 않고, 국·영·수 AI 기능을 쓸 때만
      선택한 Provider로 직접 호출돼요. 브라우저 기록을 지우면 함께 사라져요.
    </p>

    <label>
      이름
      <input v-model="name" type="text" placeholder="이름을 입력하세요" />
    </label>

    <label>
      AI Provider
      <select v-model="provider">
        <option value="gemini">Gemini</option>
        <option value="openai">GPT (OpenAI)</option>
        <option value="claude">Claude</option>
      </select>
    </label>

    <label>
      API 키 (나중에 설정에서 추가해도 됨)
      <input v-model="apiKey" type="password" placeholder="sk-..." />
    </label>

    <button :disabled="!name.trim()" @click="submit">시작하기</button>
  </section>
</template>

<style scoped>
.onboarding {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 420px;
}
.hint {
  color: #6b7280;
  font-size: 0.88rem;
  line-height: 1.5;
}
label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 600;
}
input,
select {
  font: inherit;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}
button {
  margin-top: 8px;
  padding: 10px;
  border: none;
  border-radius: 6px;
  background: #a8641c;
  color: white;
  font-weight: 600;
  cursor: pointer;
}
button:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}
</style>
