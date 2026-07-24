import { createRouter, createWebHistory } from 'vue-router'
import { getProfile } from '../lib/storage'
import Onboarding from '../views/Onboarding.vue'
import Dashboard from '../views/Dashboard.vue'
import SubjectUnits from '../views/SubjectUnits.vue'
import ProblemSolve from '../views/ProblemSolve.vue'
import ExamPaper from '../views/ExamPaper.vue'
import Settings from '../views/Settings.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/onboarding', name: 'onboarding', component: Onboarding },
    { path: '/', name: 'dashboard', component: Dashboard },
    { path: '/subjects/:subject', name: 'subject-units', component: SubjectUnits, props: true },
    { path: '/solve/:standardId', name: 'problem-solve', component: ProblemSolve, props: true },
    { path: '/exam/:standardId', name: 'exam-paper', component: ExamPaper, props: true },
    { path: '/settings', name: 'settings', component: Settings },
  ],
})

router.beforeEach((to) => {
  const hasProfile = !!getProfile()
  if (!hasProfile && to.name !== 'onboarding') {
    return { name: 'onboarding' }
  }
  if (hasProfile && to.name === 'onboarding') {
    return { name: 'dashboard' }
  }
  return true
})

export default router
