<script setup>
import { ref } from 'vue'
import {
  getProfile,
  setProfile,
  getAiSettings,
  setAiSettings,
  clearAiSettings,
  maskKey,
} from '../lib/storage'

const profile = ref(getProfile())
const name = ref(profile.value?.name ?? '')

const existing = getAiSettings()
const provider = ref(existing?.provider ?? 'gemini')
const apiKey = ref('')
const savedKeyMasked = ref(existing ? maskKey(existing.apiKey) : null)
const savedProvider = ref(existing?.provider ?? null)

function saveName() {
  if (!name.value.trim()) return
  setProfile(name.value.trim())
  profile.value = getProfile()
}

function saveKey() {
  if (!apiKey.value.trim()) return
  setAiSettings({ provider: provider.value, apiKey: apiKey.value.trim() })
  savedKeyMasked.value = maskKey(apiKey.value.trim())
  savedProvider.value = provider.value
  apiKey.value = ''
}

function removeKey() {
  clearAiSettings()
  savedKeyMasked.value = null
  savedProvider.value = null
}
</script>

<template>
  <section class="settings">
    <RouterLink to="/">← 대시보드</RouterLink>
    <h1>설정</h1>

    <div class="block">
      <h2>이름</h2>
      <div class="row">
        <input v-model="name" type="text" />
        <button @click="saveName">저장</button>
      </div>
    </div>

    <div class="block">
      <h2>AI 키</h2>
      <p v-if="savedKeyMasked" class="current">
        현재: {{ savedProvider }} · {{ savedKeyMasked }}
        <button class="link" @click="removeKey">삭제</button>
      </p>
      <p v-else class="muted">저장된 키가 없어요.</p>

      <div class="row">
        <select v-model="provider">
          <option value="gemini">Gemini</option>
          <option value="openai">GPT (OpenAI)</option>
          <option value="claude">Claude</option>
        </select>
        <input v-model="apiKey" type="password" placeholder="새 API 키" />
        <button @click="saveKey">저장</button>
      </div>
      <p class="hint">키는 이 브라우저에만 저장되고, AI 호출 시에만 선택한 Provider로 직접 전송돼요.</p>
    </div>
  </section>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.block h2 {
  font-size: 1rem;
  margin: 16px 0 8px;
}
.row {
  display: flex;
  gap: 8px;
}
input,
select {
  font: inherit;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}
button {
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  background: #a8641c;
  color: white;
  cursor: pointer;
}
button.link {
  background: none;
  color: #a13a3a;
  padding: 0;
  margin-left: 8px;
  text-decoration: underline;
}
.current {
  font-size: 0.88rem;
}
.muted {
  color: #9ca3af;
  font-size: 0.88rem;
}
.hint {
  color: #6b7280;
  font-size: 0.82rem;
  margin-top: 6px;
}
</style>
