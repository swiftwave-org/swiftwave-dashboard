<script setup>
import TableRow from '@/views/components/Table/TableRow.vue'
import Badge from '@/views/components/Badge.vue'
import FilledButton from '@/views/components/FilledButton.vue'
import { computed, ref } from 'vue'
import { getHttpBaseUrl } from '@/vendor/utils.js'
import { useRouter } from 'vue-router'
import SetupServerModal from '@/views/partials/SetupServerModal.vue'

const props = defineProps({
  server: {
    type: Object,
    required: true
  },
  refetchServers: {
    type: Function,
    required: false,
    default: () => {}
  }
})

const router = useRouter()
const actionsBtnRef = ref(null)
const actionsMenuRef = ref(null)
const setupModalRef = ref(null)
const onClickActions = () => {
  if (actionsBtnRef.value === null || actionsBtnRef.value.$el === null) {
    return
  }
  if (actionsMenuRef.value === null) {
    return
  }
  if (actionsMenuRef.value.style.display === 'block') {
    actionsMenuRef.value.style.display = 'none'
    return
  }
  const rect = actionsBtnRef.value.$el.getBoundingClientRect()
  const menuEl = actionsMenuRef.value
  menuEl.style.display = 'block'
  menuEl.style.minWidth = `${rect.width}px`
  menuEl.style.top = `${rect.top + rect.height + 8}px`
  menuEl.style.right = `${window.innerWidth - rect.left - rect.width}px`
}

const closeMenu = () => {
  actionsMenuRef.value.style.display = 'none'
}

// on screen resize close the menu
window.addEventListener('resize', closeMenu)
// on click outside close the menu
window.addEventListener('click', (e) => {
  if (!actionsBtnRef.value.$el.contains(e.target)) {
    closeMenu()
  }
})

const openWebConsole = () => {
  const height = window.innerHeight * 0.7
  const width = window.innerWidth * 0.6
  const url = `${getHttpBaseUrl()}/console?server=${props.server.id}`
  window.open(url, '', `popup,height=${height},width=${width}`)
}

const openLogsPage = () => {
  const url = router.resolve({
    name: 'Server Logs',
    query: {
      id: props.server.id,
      name: props.server.hostname
    }
  }).href
  window.open(url, '_blank')
}

const isSetupRequired = computed(() => props.server.status === 'needs_setup' || props.server.status === 'preparing')
const setupServer = () => {
  if (setupModalRef.value) {
    setupModalRef.value.openModal()
  }
}
</script>

<template>
  <SetupServerModal
    :refetch-server="refetchServers"
    ref="setupModalRef"
    :server-id="server.id"
    :server-ip="server.ip"
    :key="server.id" />
  <tr :key="server.id">
    <TableRow align="left">
      <div class="flex flex-col text-sm font-medium text-gray-900">
        {{ server.ip }}
        <span class="text-xs text-gray-700">{{ server.hostname }}</span>
      </div>
    </TableRow>
    <TableRow align="center">
      {{ server.user }}
    </TableRow>
    <TableRow align="center">
      <Badge v-if="server.swarmMode === 'manager' && !isSetupRequired" type="success">Manager</Badge>
      <Badge v-else-if="server.swarmMode === 'worker' && !isSetupRequired" type="warning">Worker</Badge>
      <span v-else></span>
    </TableRow>
    <TableRow align="center">
      <Badge v-if="server.scheduleDeployments && !isSetupRequired" type="success">Enabled</Badge>
      <Badge v-else-if="!isSetupRequired" type="danger">Disabled</Badge>
      <span v-else></span>
    </TableRow>
    <TableRow align="center">
      <Badge v-if="server.proxyEnabled && server.proxyType === 'active' && !isSetupRequired" type="success"
        >Active
      </Badge>
      <Badge v-else-if="server.proxyEnabled && server.proxyType === 'backup' && !isSetupRequired" type="warning"
        >Backup
      </Badge>
      <Badge v-else-if="!server.proxyEnabled && !isSetupRequired" type="danger">Disabled</Badge>
      <span v-else></span>
    </TableRow>
    <TableRow align="center">
      <Badge v-if="server.status === 'online'" type="success">Online</Badge>
      <Badge v-else-if="server.status === 'offline'" type="danger">Offline</Badge>
      <Badge v-else-if="server.status === 'preparing'" type="warning">Preparing</Badge>
      <FilledButton v-else-if="server.status === 'needs_setup'" type="primary" :click="setupServer" slim>
        <font-awesome-icon icon="fa-solid fa-wrench" />&nbsp;&nbsp;&nbsp;Setup Server
      </FilledButton>
    </TableRow>
    <TableRow align="center" flex>
      <FilledButton type="primary" slim>
        <font-awesome-icon icon="fa-solid fa-chart-column" />&nbsp;&nbsp;&nbsp;Analytics
      </FilledButton>
    </TableRow>
    <TableRow align="center" flex>
      <FilledButton type="primary" slim :click="openLogsPage">
        <font-awesome-icon icon="fa-solid fa-book" />&nbsp;&nbsp;&nbsp;View Logs
      </FilledButton>
    </TableRow>
    <TableRow align="right" flex>
      <FilledButton type="ghost" slim ref="actionsBtnRef" :click="onClickActions">
        <font-awesome-icon icon="fa-solid fa-ellipsis-vertical" />&nbsp;&nbsp;&nbsp;Show Actions
      </FilledButton>
    </TableRow>
  </tr>

  <div class="z-1 actions-menu" ref="actionsMenuRef" @click="closeMenu">
    <ul>
      <li @click="openWebConsole"><font-awesome-icon icon="fa-solid fa-terminal" />&nbsp;&nbsp;&nbsp;Web Console</li>
    </ul>
  </div>
</template>

<style scoped>
.actions-menu {
  @apply absolute hidden rounded-md border border-gray-200 bg-white shadow-md;

  ul {
    li {
      @apply cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100;
    }
  }
}
</style>
