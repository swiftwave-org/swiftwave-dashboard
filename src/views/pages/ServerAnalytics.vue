<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageBar from '@/views/components/PageBar.vue'
import FilledButton from '@/views/components/FilledButton.vue'
import { useLazyQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useToast } from 'vue-toastification'
import AreaChartTimeSeries from '@/views/components/AreaChartTimeSeries.vue'
import { humanizeMemoryGB, humanizeNetworkSpeed } from '@/vendor/utils.js'

const router = useRouter()
const toast = useToast()
const serverInfo = reactive({
  id: router.currentRoute.value.query.id,
  hostname: '',
  ip: ''
})

const cpuUsageSeries = ref([])
const memoryUsageSeries = ref([])
const networkUsageSeries = ref([])

// Fetch server info
const {
  load: loadServerInfo,
  loading: isServerInfoLoading,
  onResult: onServerInfoResult,
  onError: onServerInfoError
} = useLazyQuery(
  gql`
    query ($id: Uint!) {
      server(id: $id) {
        id
        hostname
        ip
      }
    }
  `,
  {
    id: serverInfo.id
  }
)

onServerInfoResult((result) => {
  serverInfo.id = result.data.server.id
  serverInfo.hostname = result.data.server.hostname
  serverInfo.ip = result.data.server.ip
  loadServerAnalytics()
})

onServerInfoError((error) => {
  toast.error(error)
})

onMounted(() => {
  if (!serverInfo.id) {
    router.push({ name: 'Servers' })
  } else {
    loadServerInfo()
  }
})

// Fetch server analytics
const {
  load: loadServerAnalyticsRaw,
  refetch: refetchServerAnalyticsRaw,
  loading: isServerAnalyticsLoading,
  onResult: onServerAnalyticsResult,
  onError: onServerAnalyticsError
} = useLazyQuery(
  gql`
    query ($id: Uint!) {
      serverResourceAnalytics(id: $id, timeframe: last_7_days) {
        cpu_usage_percent
        memory_total_gb
        memory_used_gb
        memory_cached_gb
        network_sent_kbps
        network_recv_kbps
        timestamp
      }
    }
  `,
  {
    id: serverInfo.id
  }
)
onServerAnalyticsError((error) => {
  toast.error(error)
})

onServerAnalyticsResult((result) => {
  if (result.data.serverResourceAnalytics.length !== 0) {
    let cpuUsagePercentStat = []
    let memoryTotalGbStat = []
    let memoryUsedGbStat = []
    let memoryCachedGbStat = []
    let networkSentKbpsStat = []
    let networkRecvKbpsStat = []
    result.data.serverResourceAnalytics.forEach((d) => {
      cpuUsagePercentStat.push([new Date(d.timestamp).getTime(), d.cpu_usage_percent])
      memoryTotalGbStat.push([new Date(d.timestamp).getTime(), d.memory_total_gb])
      memoryUsedGbStat.push([new Date(d.timestamp).getTime(), d.memory_used_gb])
      memoryCachedGbStat.push([new Date(d.timestamp).getTime(), d.memory_cached_gb])
      networkSentKbpsStat.push([new Date(d.timestamp).getTime(), d.network_sent_kbps])
      networkRecvKbpsStat.push([new Date(d.timestamp).getTime(), d.network_recv_kbps])
    })
    cpuUsageSeries.value = [
      {
        name: 'CPU Usage',
        data: cpuUsagePercentStat
      }
    ]
    memoryUsageSeries.value = [
      {
        name: 'Total Memory',
        data: memoryTotalGbStat
      },
      {
        name: 'Used Memory',
        data: memoryUsedGbStat
      },
      {
        name: 'Cached Memory',
        data: memoryCachedGbStat
      }
    ]
    networkUsageSeries.value = [
      {
        name: 'Sent',
        data: networkSentKbpsStat
      },
      {
        name: 'Received',
        data: networkRecvKbpsStat
      }
    ]
  }
})

const loadServerAnalytics = () => {
  if (loadServerAnalyticsRaw() === false) {
    refetchServerAnalyticsRaw()
  }
}
</script>

<template>
  <section class="mx-auto w-full max-w-7xl">
    <div v-if="isServerInfoLoading" class="w-full font-medium italic">Fetching server info...</div>
    <div v-else class="flex w-full flex-col">
      <!-- Top Page bar   -->
      <PageBar>
        <template v-slot:title>Server {{ serverInfo.hostname }} ({{ serverInfo.ip }})</template>
        <template v-slot:subtitle>Monitor the resource analytics of your server</template>
        <template v-slot:buttons>
          <FilledButton type="primary" :click="loadServerAnalytics" :loading="isServerAnalyticsLoading"
            >Refresh Stats
          </FilledButton>
        </template>
      </PageBar>
      <div class="mt-5 flex w-full flex-col gap-4">
        <!--  Cpu usage series  -->
        <AreaChartTimeSeries
          title="CPU Usage"
          :series="cpuUsageSeries"
          :stops="[0, 100]"
          :y-axis-formatter="
            (val) => {
              return val + ' %'
            }
          " />
        <div class="my-2"></div>
        <!--  Memory usage series  -->
        <AreaChartTimeSeries
          title="Memory Usage"
          :series="memoryUsageSeries"
          :stops="[0, 100]"
          :y-axis-formatter="humanizeMemoryGB" />
        <div class="my-2"></div>
        <!--  Network usage series  -->
        <AreaChartTimeSeries
          title="Network Usage"
          :series="networkUsageSeries"
          :stops="[0, 100]"
          :y-axis-formatter="humanizeNetworkSpeed" />
      </div>
    </div>
  </section>
</template>

<style scoped></style>
