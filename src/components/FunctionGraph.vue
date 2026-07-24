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

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)

  const xMin = -8
  const xMax = 8
  const samples = []
  for (let px = 0; px <= w; px++) {
    const x = xMin + (px / w) * (xMax - xMin)
    const y = evaluate(x)
    if (y !== null && Number.isFinite(y)) samples.push({ x, y })
  }
  if (!samples.length) return

  const ys = samples.map((s) => s.y)
  let yMin = Math.min(...ys, -1)
  let yMax = Math.max(...ys, 1)
  const yPad = (yMax - yMin) * 0.1 || 1
  yMin -= yPad
  yMax += yPad

  const toPx = (x) => ((x - xMin) / (xMax - xMin)) * w
  const toPy = (y) => h - ((y - yMin) / (yMax - yMin)) * h

  ctx.strokeStyle = '#e5e0d3'
  ctx.lineWidth = 1
  for (let gx = Math.ceil(xMin / 2) * 2; gx <= xMax; gx += 2) {
    ctx.beginPath()
    ctx.moveTo(toPx(gx), 0)
    ctx.lineTo(toPx(gx), h)
    ctx.stroke()
  }
  for (let gy = Math.ceil(yMin / 2) * 2; gy <= yMax; gy += 2) {
    ctx.beginPath()
    ctx.moveTo(0, toPy(gy))
    ctx.lineTo(w, toPy(gy))
    ctx.stroke()
  }

  ctx.strokeStyle = '#8a5716'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(0, toPy(0))
  ctx.lineTo(w, toPy(0))
  ctx.moveTo(toPx(0), 0)
  ctx.lineTo(toPx(0), h)
  ctx.stroke()

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
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  margin: 10px 0;
}
</style>
