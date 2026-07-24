#!/usr/bin/env node
// 저장소 전체 문항 파일을 한 번에 구조 검증한다.
// 사용: node scripts/verify-questions.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const QUESTIONS_DIR = path.join(__dirname, '..', 'public', 'study-data', 'questions')
const STANDARDS_FILE = path.join(__dirname, '..', 'public', 'study-data', 'standards.json')

const standards = JSON.parse(fs.readFileSync(STANDARDS_FILE, 'utf8'))
const standardIds = new Set(standards.map((s) => s.id))
// 국어/영어/수학 중학 성취기준은 7~9학년(중1~3) 공통이라, 같은 코드가 여러 단원에
// 정당하게 재사용될 수 있다(예: 9국05-01은 KOR-1-1과 KOR-2-1 모두에 배정됨).
// 그래서 "코드가 어느 단원에 속하는지"는 검사하지 않고, "실제 교육과정에 존재하는
// 코드인지"만 확인한다. 단원의 지정 성취기준 외에 다른 코드를 보너스로 쓰는 것도
// (예: 문법 문항에 9국04-04) 의도된 설계이므로 허용한다.
const knownCodes = new Set(standards.flatMap((s) => (s.achievementStandards ?? []).map((a) => a.code)))

const files = fs.readdirSync(QUESTIONS_DIR).filter((f) => f.endsWith('.json'))
const allIds = new Map() // id -> file (전체 파일 통합 중복 검사)
const codeCounts = {} // standardId -> { code: count }
let problems = 0
let total = 0

function fail(msg) {
  console.log('✗', msg)
  problems++
}

for (const file of files) {
  const expectedStandardId = file.replace(/\.json$/, '')
  const items = JSON.parse(fs.readFileSync(path.join(QUESTIONS_DIR, file), 'utf8'))
  total += items.length

  if (!standardIds.has(expectedStandardId)) {
    fail(`${file}: standards.json에 없는 단원 ID (${expectedStandardId})`)
  }

  for (const q of items) {
    if (allIds.has(q.id)) {
      fail(`${q.id}: ${file}과 ${allIds.get(q.id)}에 중복 존재`)
    }
    allIds.set(q.id, file)

    if (q.standardId !== expectedStandardId) {
      fail(`${q.id}: standardId(${q.standardId})가 파일명(${expectedStandardId})과 다름`)
    }
    if (!q.choices || Object.keys(q.choices).length !== 5) {
      fail(`${q.id}: 선택지가 5개가 아님`)
    }
    if (!q.answer || !(q.answer in (q.choices ?? {}))) {
      fail(`${q.id}: answer(${q.answer})가 choices에 없음`)
    }
    if (!q.achievementCode) {
      fail(`${q.id}: achievementCode 필드 없음`)
    } else if (!knownCodes.has(q.achievementCode)) {
      fail(`${q.id}: achievementCode(${q.achievementCode})가 standards.json에 존재하지 않는 코드 (오타 의심)`)
    }

    if (q.achievementCode) {
      codeCounts[expectedStandardId] ??= {}
      codeCounts[expectedStandardId][q.achievementCode] =
        (codeCounts[expectedStandardId][q.achievementCode] ?? 0) + 1
    }
  }
}

console.log('\n--- 성취기준별 문항 수 (10~15개 권장) ---')
for (const [sid, codes] of Object.entries(codeCounts)) {
  for (const [code, count] of Object.entries(codes)) {
    const flag = count < 10 ? '  ← 10개 미만' : ''
    console.log(`${sid.padEnd(10)} ${code}  ${count}개${flag}`)
  }
}

console.log(`\n총 ${files.length}개 파일, ${total}개 문항, 문제 ${problems}건`)
process.exit(problems > 0 ? 1 : 0)
