const KEYS = {
  profile: 'coach.profile',
  aiSettings: 'coach.aiSettings',
  attempts: 'coach.attempts',
  wrongNotes: 'coach.wrongNotes',
  aiCallLog: 'coach.aiCallLog',
}

function readJson(key, fallback) {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getProfile() {
  return readJson(KEYS.profile, null)
}

export function setProfile(name) {
  writeJson(KEYS.profile, { name })
}

export function getAiSettings() {
  return readJson(KEYS.aiSettings, null)
}

export function setAiSettings({ provider, apiKey, model }) {
  writeJson(KEYS.aiSettings, { provider, apiKey, model })
}

export function clearAiSettings() {
  localStorage.removeItem(KEYS.aiSettings)
}

export function maskKey(apiKey) {
  if (!apiKey || apiKey.length < 8) return '****'
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`
}

export function getAttempts() {
  return readJson(KEYS.attempts, [])
}

export function addAttempt(attempt) {
  const attempts = getAttempts()
  attempts.push({ ...attempt, at: new Date().toISOString() })
  writeJson(KEYS.attempts, attempts)
}

export function getWrongNotes() {
  return readJson(KEYS.wrongNotes, [])
}

export function addWrongNote(note) {
  const notes = getWrongNotes().filter((n) => n.questionId !== note.questionId)
  notes.push({ ...note, addedAt: new Date().toISOString() })
  writeJson(KEYS.wrongNotes, notes)
}

const DAILY_CALL_LIMIT = 50

export function canCallAiToday() {
  const today = new Date().toISOString().slice(0, 10)
  const log = readJson(KEYS.aiCallLog, [])
  const todayCount = log.filter((entry) => entry.date === today).length
  return todayCount < DAILY_CALL_LIMIT
}

export function recordAiCall(kind) {
  const today = new Date().toISOString().slice(0, 10)
  const log = readJson(KEYS.aiCallLog, [])
  log.push({ kind, date: today })
  writeJson(KEYS.aiCallLog, log.slice(-500))
}
