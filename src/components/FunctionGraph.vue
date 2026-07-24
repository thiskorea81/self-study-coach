<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({ graph: { type: Object, required: true } })
const canvasRef = ref(null)

function evaluate(x) {
  const g = props.graph
  if (g.type === 'quadratic') return g.a * x * x + g.b * x + g.c
  if (g.type === 'linear') return g.m * x + g.b
  return null
}

// 격자 간격을 데이터 범위에 맞춰 1, 2, 5, 10... 중 정수 눈금만 나오는 간격으로 고른다.
function niceStep(range) {
  const raw = range / 6
  const pow10 = 10 ** Math.floor(Math.log10(raw))
  const candidates = [1, 2, 5, 10].map((m) => m * pow10)
  const step = candidates.find((c) => c >= raw) ?? candidates[candidates.length - 1]
  return Math.max(1, Math.round(step))
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)

  const margin = { left: 26, right: 8, top: 8, bottom: 18 }
  const plotW = w - margin.left - margin.right
  const plotH = h - margin.top - margin.bottom

  const xMin = -8
  const xMax = 8
  const samples = []
  for (let i = 0; i <= plotW; i++) {
    const x = xMin + (i / plotW) * (xMax - xMin)
    const y = evaluate(x)
    if (y !== null && Number.isFinite(y)) samples.push({ x, y })
  }
  if (!samples.length) return

  const ys = samples.map((s) => s.y)
  let yMin = Math.min(...ys, -1)
  let yMax = Math.max(...ys, 1)
  const yPad = (yMax - yMin) * 0.15 || 1
  yMin -= yPad
  yMax += yPad

  const toPx = (x) => margin.left + ((x - xMin) / (xMax - xMin)) * plotW
  const toPy = (y) => margin.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH

  const xStep = niceStep(xMax - xMin)
  const yStep = niceStep(yMax - yMin)

  ctx.font = '9px -apple-system, sans-serif'
  ctx.fillStyle = '#9a8f7a'

  // 세로 격자선 + x축 정수 눈금
  ctx.strokeStyle = '#eee9db'
  ctx.lineWidth = 1
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  for (let gx = Math.ceil(xMin / xStep) * xStep; gx <= xMax; gx += xStep) {
    const px = toPx(gx)
    ctx.beginPath()
    ctx.moveTo(px, margin.top)
    ctx.lineTo(px, margin.top + plotH)
    ctx.stroke()
    ctx.fillText(String(Math.round(gx)), px, margin.top + plotH + 3)
  }

  // 가로 격자선 + y축 정수 눈금 (0은 x축 쪽에서 한 번만 표시)
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (let gy = Math.ceil(yMin / yStep) * yStep; gy <= yMax; gy += yStep) {
    const py = toPy(gy)
    ctx.beginPath()
    ctx.moveTo(margin.left, py)
    ctx.lineTo(margin.left + plotW, py)
    ctx.stroke()
    if (gy !== 0) ctx.fillText(String(Math.round(gy)), margin.left - 4, py)
  }

  // x축 / y축 본선
  ctx.strokeStyle = '#8a5716'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(margin.left, toPy(0))
  ctx.lineTo(margin.left + plotW, toPy(0))
  ctx.moveTo(toPx(0), margin.top)
  ctx.lineTo(toPx(0), margin.top + plotH)
  ctx.stroke()

  // 함수 곡선
  ctx.strokeStyle = '#a8641c'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  samples.forEach((s, i) => {
    const px = toPx(s.x)
    const py = toPy(s.y)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.stroke()
}

onMounted(draw)
watch(() => props.graph, draw, { deep: true })
</script>

<template>
  <canvas ref="canvasRef" width="280" height="220" class="graph"></canvas>
</template>

<style scoped>
.graph {
  display: block;
  align-self: flex-start;
  width: 280px;
  height: 220px;
  max-width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  margin: 10px 0;
}
</style>
