<template>
  <div class="play-analysis">
    <h2>Play Analysis</h2>
    <div class="data-container">
      <div>Loading Status: {{ loading ? 'Loading...' : 'Done' }}</div>
      <div class="stats">
        <div>Total Plays: {{ plays.length }}</div>
        <div>Run Plays: {{ runPlays.length }}</div>
        <div>Pass Plays: {{ passPlays.length }}</div>
      </div>
      <div class="chart-container" ref="chartContainer"></div>
      <pre v-if="error">{{ error }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import * as d3 from 'd3'
import playsData from '../data/plays.yaml'

const loading = ref(true)
const error = ref(null)
const plays = ref([])
const chartContainer = ref(null)

const runPlays = computed(() => plays.value.filter(play => play.type === 'run'))
const passPlays = computed(() => plays.value.filter(play => play.type === 'pass'))

const createPieChart = () => {
  if (!chartContainer.value || !plays.value.length) return

  // Clear previous chart if any
  d3.select(chartContainer.value).selectAll('*').remove()

  const width = 400
  const height = 400
  const radius = Math.min(width, height) / 2

  const svg = d3.select(chartContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`)

  const data = [
    { type: 'Run', value: runPlays.value.length },
    { type: 'Pass', value: passPlays.value.length }
  ]

  const color = d3.scaleOrdinal()
    .domain(['Run', 'Pass'])
    .range(['#4CAF50', '#2196F3'])

  const pie = d3.pie()
    .value(d => d.value)

  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius)

  const arcs = svg.selectAll('arc')
    .data(pie(data))
    .enter()
    .append('g')

  arcs.append('path')
    .attr('d', arc)
    .attr('fill', d => color(d.data.type))
    .attr('stroke', 'white')
    .style('stroke-width', '2px')

  arcs.append('text')
    .attr('transform', d => `translate(${arc.centroid(d)})`)
    .attr('text-anchor', 'middle')
    .text(d => `${d.data.type} (${d.data.value})`)
    .style('fill', 'white')
    .style('font-size', '14px')
}

onMounted(() => {
  try {
    console.log('Component mounted')
    if (playsData && playsData.plays) {
      plays.value = playsData.plays
      console.log('Plays loaded:', plays.value)
      createPieChart()
    } else {
      error.value = 'No plays data found in YAML'
      console.error('No plays data found in YAML')
    }
  } catch (err) {
    error.value = err.message
    console.error('Error loading plays:', err)
  } finally {
    loading.value = false
  }
})

// Recreate chart when plays data changes
watch([runPlays, passPlays], () => {
  createPieChart()
})
</script>

<style scoped>
.play-analysis {
  padding: 20px;
}

.data-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.stats {
  display: grid;
  gap: 10px;
  margin-bottom: 20px;
  text-align: center;
}

.chart-container {
  width: 400px;
  height: 400px;
  margin: 0 auto;
}

.data-container {
  margin-top: 20px;
  display: grid;
  gap: 10px;
}
</style>
