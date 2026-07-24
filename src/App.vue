<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <RouterLink to="/" class="brand">자기주도 학습 코치</RouterLink>
      <RouterLink to="/settings" class="settings-link">설정</RouterLink>
    </header>
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #e2ddd0;
}
.brand {
  font-weight: 700;
  text-decoration: none;
  color: inherit;
}
.settings-link {
  font-size: 0.85rem;
  color: #6b7280;
  text-decoration: none;
}
.content {
  flex: 1;
  padding: 24px 20px 60px;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
}
</style>
