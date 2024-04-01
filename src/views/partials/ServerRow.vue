<script setup>
import TableRow from '@/views/components/Table/TableRow.vue'
import Badge from '@/views/components/Badge.vue'
import FilledButton from '@/views/components/FilledButton.vue'
import { computed, ref } from 'vue'
import { getHttpBaseUrl } from '@/vendor/utils.js'
import { useRouter } from 'vue-router'
import SetupServerModal from '@/views/partials/SetupServerModal.vue'
import EnableServerProxyModal from '@/views/partials/EnableServerProxyModal.vue'
import { useMutation } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useToast } from 'vue-toastification'
import SetupResourceMonitoring from '@/views/partials/SetupResourceMonitoring.vue'

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
const toast = useToast()
const actionsBtnRef = ref(null)
const actionsMenuRef = ref(null)
const setupModalRef = ref(null)
const enableProxyModalRef = ref(null)
const setupResourceMonitoringModalRef = ref(null)
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
  if (!actionsMenuRef.value) {
    return
  }
  actionsMenuRef.value.style.display = 'none'
}

// on screen resize close the menu
window.addEventListener('resize', closeMenu)
// on click outside close the menu
window.addEventListener('click', (e) => {
  if (!actionsMenuRef.value || !actionsBtnRef.value.$el) {
    return
  }
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

// Enable proxy
const enableProxy = () => {
  if (enableProxyModalRef.value) {
    enableProxyModalRef.value.openModal()
  }
}

// Disable proxy
const {
  mutate: disableProxyRaw,
  onError: disableProxyError,
  onDone: disableProxyDone
} = useMutation(gql`
  mutation DisableProxy($serverId: Uint!) {
    disableProxyOnServer(id: $serverId)
  }
`)

disableProxyError((error) => {
  toast.error(error.message)
})

disableProxyDone((val) => {
  if (val.data.disableProxyOnServer) {
    toast.success(
      'Proxy has been disabled on the requested server\nThis can take upto 5 minutes to reflect in the system'
    )
    props.refetchServers()
  }
})

const disableProxy = () => {
  disableProxyRaw({
    serverId: props.server.id
  })
}

// Demote swarm node to worker
const {
  mutate: demoteToWorkerRaw,
  onError: demoteToWorkerError,
  onDone: demoteToWorkerDone
} = useMutation(gql`
  mutation DemoteToWorker($serverId: Uint!) {
    demoteServerToWorker(id: $serverId)
  }
`)

demoteToWorkerError((error) => {
  toast.error(error.message)
})

demoteToWorkerDone((val) => {
  if (val.data.demoteServerToWorker) {
    toast.success('Server has been demoted to worker node\nThis can take upto 5 minutes to reflect in the system')
    props.refetchServers()
  } else {
    toast.error('Failed to demote server to worker')
  }
})

const demoteToWorker = () => {
  demoteToWorkerRaw({
    serverId: props.server.id
  })
}

// Promote swarm node to manager
const {
  mutate: promoteToManagerRaw,
  onError: promoteToManagerError,
  onDone: promoteToManagerDone
} = useMutation(gql`
  mutation PromoteToManager($serverId: Uint!) {
    promoteServerToManager(id: $serverId)
  }
`)

promoteToManagerError((error) => {
  toast.error(error.message)
})

promoteToManagerDone((val) => {
  if (val.data.promoteServerToManager) {
    toast.success('Server has been promoted to manager node\nThis can take upto 5 minutes to reflect in the system')
    props.refetchServers()
  } else {
    toast.error('Failed to promote server to manager')
  }
})

const promoteToManager = () => {
  promoteToManagerRaw({
    serverId: props.server.id
  })
}

// Setup resource monitoring
const setupResourceMonitoring = () => {
  if (setupResourceMonitoringModalRef.value) {
    setupResourceMonitoringModalRef.value.openModal()
  }
}

// Open analytics page
const openAnalyticsPage = () => {
  router.push({
    name: 'Server Analytics',
    query: {
      id: props.server.id
    }
  })
}

// Disable deployment on server
const {
  mutate: disableDeploymentOnServerRaw,
  onError: disableDeploymentOnServerError,
  onDone: disableDeploymentOnServerDone
} = useMutation(gql`
  mutation DisableDeploymentOnServer($serverId: Uint!) {
    restrictDeploymentOnServer(id: $serverId)
  }
`)

disableDeploymentOnServerError((error) => {
  toast.error(error.message)
})

disableDeploymentOnServerDone((val) => {
  if (val.data.restrictDeploymentOnServer) {
    toast.success('Deployments have been disabled on the requested server')
    props.refetchServers()
  } else {
    toast.error('Failed to disable deployments on server')
  }
})

const disableDeploymentOnServer = () => {
  const confirmation = confirm(
    'Are you sure that you want to disable deployments on this server ?\n All deployments will be moved to other servers.'
  )
  if (confirmation) {
    disableDeploymentOnServerRaw({
      serverId: props.server.id
    })
  }
}

// Enable deployment on server
const {
  mutate: enableDeploymentOnServerRaw,
  onError: enableDeploymentOnServerError,
  onDone: enableDeploymentOnServerDone
} = useMutation(gql`
  mutation EnableDeploymentOnServer($serverId: Uint!) {
    allowDeploymentOnServer(id: $serverId)
  }
`)

enableDeploymentOnServerError((error) => {
  toast.error(error.message)
})

enableDeploymentOnServerDone((val) => {
  if (val.data.allowDeploymentOnServer) {
    toast.success('Deployments have been enabled on the requested server')
    props.refetchServers()
  } else {
    toast.error('Failed to enable deployments on server')
  }
})

const enableDeploymentOnServer = () => {
  const confirmation = confirm('Are you sure that you want to enable deployments on this server ?')
  if (confirmation) {
    enableDeploymentOnServerRaw({
      serverId: props.server.id
    })
  }
}
</script>

<template>
  <SetupServerModal
    :refetch-server="refetchServers"
    ref="setupModalRef"
    :server-id="server.id"
    :server-ip="server.ip"
    :key="server.id + '_setup_server_modal'" />

  <EnableServerProxyModal ref="enableProxyModalRef" :server-id="server.id" :key="server.id + '_enable_proxy_modal'" />
  <SetupResourceMonitoring
    ref="setupResourceMonitoringModalRef"
    :server-id="server.id"
    :key="server.id + '_setup_resource_monitoring_modal'"
    :open-web-console="openWebConsole" />

  <tr :key="server.id + '_server_row'">
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
      <FilledButton type="primary" slim :click="openAnalyticsPage">
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
      <li v-if="server.proxyEnabled && !isSetupRequired" @click="disableProxy">
        <font-awesome-icon icon="fa-solid fa-diagram-project" />&nbsp;&nbsp;&nbsp;Disable Ingress Proxy
      </li>
      <li v-if="!server.proxyEnabled && !isSetupRequired" @click="enableProxy">
        <font-awesome-icon icon="fa-solid fa-diagram-project" />&nbsp;&nbsp;&nbsp;Enable Ingress Proxy
      </li>
      <li v-if="server.swarmMode === 'manager' && !isSetupRequired" @click="demoteToWorker">
        <font-awesome-icon icon="fa-solid fa-angle-down" />&nbsp;&nbsp;&nbsp;Demote to Swarm Worker
      </li>
      <li v-if="server.swarmMode === 'worker' && !isSetupRequired" @click="promoteToManager">
        <font-awesome-icon icon="fa-solid fa-angle-up" />&nbsp;&nbsp;&nbsp;Promote to Swarm Manager
      </li>
      <li v-if="!isSetupRequired" @click="setupResourceMonitoring">
        <font-awesome-icon icon="fa-solid fa-hammer" />&nbsp;&nbsp;&nbsp;Setup Resource Monitoring
      </li>
      <li v-if="server.scheduleDeployments && !isSetupRequired" @click="disableDeploymentOnServer">
        <font-awesome-icon icon="fa-solid fa-stop" />&nbsp;&nbsp;&nbsp;Disable Deployment on Server
      </li>
      <li v-if="!server.scheduleDeployments && !isSetupRequired" @click="enableDeploymentOnServer">
        <font-awesome-icon icon="fa-solid fa-play" />&nbsp;&nbsp;&nbsp;Enable Deployment on Server
      </li>
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
