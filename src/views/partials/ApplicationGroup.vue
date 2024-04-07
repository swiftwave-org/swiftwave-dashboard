<script setup>
import ApplicationListRow from '@/views/partials/ApplicationListRow.vue'
import { onMounted } from 'vue'
import { getRandomBackgroundAndBorderColourClass } from '@/vendor/utils.js'

const props = defineProps({
  groupIndex: {
    type: Number,
    default: null
  },
  group: {
    type: String,
    default: ''
  },
  applications: {
    type: Array,
    default: () => []
  }
})

const placeGroupDiv = () => {
  if (props.applications.length === 0) return
  if (props.group === '') return
  const firstTableRowId = `group_${props.group}_${props.applications[0].id}`
  const firstTableRowElement = document.getElementById(firstTableRowId)
  const lastTableRowId = `group_${props.group}_${props.applications[props.applications.length - 1].id}`
  const lastTableRowElement = document.getElementById(lastTableRowId)
  const height = lastTableRowElement.getBoundingClientRect().bottom - firstTableRowElement.getBoundingClientRect().top
  const yStart = firstTableRowElement.getBoundingClientRect().top
  const xEnd = window.innerWidth - firstTableRowElement.getBoundingClientRect().x

  const groupElement = document.getElementById(`group_${props.group}`)
  if (!groupElement) return
  const colorClasses = getRandomBackgroundAndBorderColourClass(props.groupIndex)
  groupElement.classList.add(colorClasses[0])
  groupElement.classList.add(colorClasses[1])
  groupElement.style.height = `${height}px`
  groupElement.style.top = `${yStart}px`
  groupElement.style.right = `${xEnd}px`
}

const initGroupDiv = () => {
  placeGroupDiv()
  window.addEventListener('resize', placeGroupDiv)
}

onMounted(() => {
  initGroupDiv()
})
</script>

<template>
  <div
    v-show="group !== ''"
    :id="`group_${group}`"
    style="writing-mode: vertical-rl"
    class="absolute inline-block rotate-180 cursor-pointer select-none overflow-hidden truncate text-nowrap rounded-r-md !border-2 !border-l-0 px-0.5 py-2 text-center text-sm transition-all hover:text-wrap">
    {{ decodeURI(group) }}
  </div>
  <ApplicationListRow
    v-for="application in applications"
    :key="application.id"
    :application="application"
    :id="`group_${group}_${application.id}`" />
</template>

<style scoped></style>
