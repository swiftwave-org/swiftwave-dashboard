<script setup>
import ApplicationListRow from '@/views/partials/ApplicationListRow.vue'
import { computed, onMounted, ref } from 'vue'
import { getRandomBackgroundAndBorderColourClass } from '@/vendor/utils.js'
import TableRow from '@/views/components/Table/TableRow.vue'
import FilledButton from '@/views/components/FilledButton.vue'
import UptimeChart from '@/views/components/UptimeChart.vue'

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

const isExpanded = ref(false)
const groupReplicasPercentage = computed(() => {
  let liveApps = (props.applications || []).filter(
    (item) => item.latestDeployment && item.latestDeployment.status === 'live'
  ).length
  return (liveApps / props.applications.length) * 100
})

const placeGroupDiv = () => {
  if (!isApplicationListVisible.value) return
  if (props.applications.length === 0) return
  if (props.group === '') return
  const firstTableRowId = `group_${props.group}_${props.applications[0].id}`
  const firstTableRowElement = document.getElementById(firstTableRowId)
  const lastTableRowId = `group_${props.group}_${props.applications[props.applications.length - 1].id}`
  const lastTableRowElement = document.getElementById(lastTableRowId)
  const height = lastTableRowElement.getBoundingClientRect().bottom - firstTableRowElement.getBoundingClientRect().top
  const yStart = firstTableRowElement.getBoundingClientRect().top
  const xEnd = window.innerWidth - firstTableRowElement.getBoundingClientRect().x

  const groupElement = document.getElementById(`group_${props.group}_tag`)
  if (!groupElement) return
  const colorClasses = getRandomBackgroundAndBorderColourClass(props.groupIndex)
  groupElement.classList.add(colorClasses[0])
  groupElement.classList.add(colorClasses[1])
  groupElement.style.height = `${height}px`
  groupElement.style.top = `${yStart}px`
  groupElement.style.right = `${xEnd}px`
  groupElement.classList.remove('hidden')
}

const removeGroupDiv = () => {
  const groupElement = document.getElementById(`group_${props.group}_tag`)
  if (!groupElement) return
  groupElement.classList.add('hidden')
}

const initGroupDiv = () => {
  placeGroupDiv()
  window.addEventListener('resize', placeGroupDiv)
}

const isApplicationListVisible = computed(() => {
  return isExpanded.value || props.group === ''
})

const isGroupTagVisible = computed(() => {
  if (props.group === '') return false
  return isExpanded.value
})

const showApplicationList = () => {
  isExpanded.value = true
  setTimeout(() => {
    placeGroupDiv()
  }, 100)
}

const hideApplicationList = () => {
  isExpanded.value = false
  removeGroupDiv()
}

onMounted(() => {
  initGroupDiv()
})
</script>

<template>
  <div
    v-if="isGroupTagVisible"
    :id="`group_${group}_tag`"
    style="writing-mode: vertical-rl"
    class="absolute hidden rotate-180 cursor-pointer select-none overflow-hidden truncate text-nowrap rounded-r-md !border-2 !border-l-0 px-0.5 py-2 text-center text-sm transition-all hover:text-wrap">
    {{ decodeURI(group) }}
  </div>
  <tr
    v-if="group !== ''"
    @click.prevent="isExpanded ? hideApplicationList() : showApplicationList()"
    class="cursor-pointer">
    <TableRow align="left">
      <div class="text-sm font-medium text-gray-900">
        {{ decodeURI(group) }}
      </div>
    </TableRow>
    <TableRow align="center" class="text-sm text-gray-700"> {{ groupReplicasPercentage }}% live</TableRow>
    <TableRow align="center" flex>
      <UptimeChart
        :label="`${groupReplicasPercentage}%`"
        :percentage="groupReplicasPercentage"
        :hide-label="true"
        :small="true"
        :hide-hover="true" />
    </TableRow>
    <TableRow align="center" class="text-sm text-gray-700">{{ applications.length }} apps</TableRow>
    <TableRow align="center">-</TableRow>
    <TableRow align="right" flex>
      <FilledButton slim type="primary" v-if="isExpanded" :click="hideApplicationList">Hide Apps</FilledButton>
      <FilledButton slim type="primary" v-else :click="showApplicationList">View Apps</FilledButton>
    </TableRow>
  </tr>
  <ApplicationListRow
    :is-visible="isApplicationListVisible"
    v-for="application in applications"
    :key="application.id"
    :application="application"
    :id="`group_${group}_${application.id}`" />
</template>

<style scoped></style>
