<script setup>
import { useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'
import { useLazyQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useToast } from 'vue-toastification'
import PageBar from '@/views/components/PageBar.vue'
import FilledButton from '@/views/components/FilledButton.vue'

const router = useRouter()
const toast = useToast()
const serverId = router.currentRoute.value.query.id
const serverName = router.currentRoute.value.query.name

const serverLogs = ref('')

const {
  load: fetchServerLogs,
  refetch: refetchServerLogs,
  loading: serverLogsLoading,
  onResult: onServerLogsResult,
  onError: onServerLogsError,
  variables: serverLogsVariables
} = useLazyQuery(gql`
  query GetServerLogs($serverId: Uint!) {
    fetchServerLogContent(id: $serverId)
  }
`)

onServerLogsResult((result) => {
  if (result.data && result.data.fetchServerLogContent) {
    serverLogs.value = result.data.fetchServerLogContent
  }
})

onServerLogsError((error) => {
  toast.error(error.message)
})

function loadServerLogs() {
  serverLogsVariables.value = { serverId }
  if (fetchServerLogs() === false) {
    refetchServerLogs()
  }
}

onMounted(() => {
  if (!serverId) {
    alert('Try to re-open the page from the server list')
  }
  if (serverName) {
    document.title = `${serverName} - Server Logs`
  }
  loadServerLogs()
})
</script>

<template>
  <PageBar>
    <template v-slot:title>{{ serverName }}</template>
    <template v-slot:subtitle>These logs are related to the actions performed on the server</template>
    <template v-slot:buttons>
      <FilledButton type="ghost" :click="loadServerLogs">
        <font-awesome-icon
          icon="fa-solid fa-arrows-rotate"
          :class="{
            'animate-spin ': serverLogsLoading
          }" />&nbsp;&nbsp;Refresh
      </FilledButton>
    </template>
  </PageBar>

  <div
    v-if="serverLogs.length === 0"
    class="mt-6 max-h-[80vh] w-full overflow-y-auto whitespace-pre-wrap rounded-lg border-2 border-secondary-200 bg-secondary-100 p-4">
    <i>No Logs found. Check later or refresh logs</i>
  </div>
  <div
    v-else
    class="mt-6 max-h-[80vh] w-full overflow-y-auto whitespace-pre-wrap rounded-lg border-2 border-secondary-200 bg-secondary-100 p-4">
    {{ serverLogs }}
  </div>
</template>

<style scoped></style>
