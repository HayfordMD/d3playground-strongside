<template>
  <div id="app">
    <h1>Football Analytics Dashboard</h1>
    <PlayAnalysis />
  </div>
</template>

<script setup>
import PlayAnalysis from './components/PlayAnalysis.vue'
</script>

<style>
#app {
  font-family: Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 20px;
}
</style>
