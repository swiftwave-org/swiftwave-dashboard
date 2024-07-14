<script setup>
// Toast
import { useQuery } from '@vue/apollo-composable'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import gql from 'graphql-tag'
import { computed, ref } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import Table from '@/views/components/Table/Table.vue'
import TableHeader from '@/views/components/Table/TableHeader.vue'
import TableMessage from '@/views/components/Table/TableMessage.vue'
import ApplicationListRow from '@/views/partials/ApplicationListRow.vue'
import DeleteApplicationsModal from '@/views/partials/DeleteApplicationsModal.vue'
import RestartApplicationsModal from '@/views/partials/RestartApplicationsModal.vue'
import RebuildApplicationsModal from '@/views/partials/RebuildApplicationsModal.vue'

const toast = useToast()

// Get the application ID from the URL
const router = useRouter()
const applicationGroupId = router.currentRoute.value.params.id

// Fetch the application details
const {
  result: applicationGroupDetailsRaw,
  loading: applicationGroupDetailsLoading,
  refetch: refetchGroupApplicationDetails,
  onError: onErrorGroupApplicationDetails
} = useQuery(
  gql`
    query ($id: String!) {
      applicationGroup(id: $id) {
        id
        name
        logo
        applications {
          id
          name
          replicas
          isSleeping
          latestDeployment {
            upstreamType
            status
            createdAt
          }
          realtimeInfo {
            InfoFound
            DeploymentMode
            DesiredReplicas
            RunningReplicas
            HealthStatus
          }
          environmentVariables {
            key
            value
          }
          ingressRules {
            domain {
              name
            }
            protocol
            port
          }
          configMounts {
            content
            mountingPath
            uid
            gid
          }
        }
      }
    }
  `,
  {
    id: applicationGroupId
  },
  {
    pollInterval: 30000
  }
)

onErrorGroupApplicationDetails(() => {
  toast.error('Failed to fetch application group details')
})

const applicationGroupDetails = computed(() => applicationGroupDetailsRaw.value?.applicationGroup ?? {})
const applications = computed(() => applicationGroupDetailsRaw.value?.applicationGroup?.applications ?? [])
const ingressRules = computed(() => {
  let records = []
  for (const application of applications.value) {
    records.push(...application.ingressRules)
  }
  return records
})

const totalServiceCount = computed(() => {
  if (applicationGroupDetails.value.applications.length === 0) {
    return 0
  }
  return applicationGroupDetails.value.applications.length
})

const healthyServiceCount = computed(() => {
  if (applicationGroupDetails.value.applications.length === 0) {
    return 0
  }
  return applicationGroupDetails.value.applications.filter((app) => app.realtimeInfo.HealthStatus === 'healthy').length
})

const unhealthyServiceCount = computed(() => {
  if (applicationGroupDetails.value.applications.length === 0) {
    return 0
  }
  return applicationGroupDetails.value.applications.filter((app) => app.realtimeInfo.HealthStatus === 'unhealthy')
    .length
})

const applicationIds = computed(() => {
  return applicationGroupDetails.value.applications.map((app) => app.id)
})

const deleteApplicationsModal = ref(null)
const restartApplicationsModal = ref(null)
const rebuildApplicationsModal = ref(null)

function deleteApplications() {
  if (deleteApplicationsModal.value) {
    deleteApplicationsModal.value.openModal()
  }
}

function restartApplications() {
  if (restartApplicationsModal.value) {
    restartApplicationsModal.value.openModal()
  }
}

function rebuildApplications() {
  if (rebuildApplicationsModal.value) {
    rebuildApplicationsModal.value.openModal()
  }
}

// page
const pageName = ref('deployed-apps')
</script>

<template>
  <!-- Main -->
  <div v-if="applicationGroupDetailsLoading">
    <p>Loading...</p>
  </div>
  <section v-else class="mx-auto w-full max-w-7xl">
    <!--  Modals  -->
    <DeleteApplicationsModal ref="deleteApplicationsModal" :application-ids="applicationIds" />
    <RestartApplicationsModal
      ref="restartApplicationsModal"
      :application-ids="applicationIds"
      :on-done="refetchGroupApplicationDetails" />
    <RebuildApplicationsModal
      ref="rebuildApplicationsModal"
      :application-ids="applicationIds"
      :on-done="refetchGroupApplicationDetails" />
    <!--  First line  -->
    <div class="flex w-full flex-row items-center justify-between">
      <!--   App name     -->
      <div class="flex items-center gap-2">
        <div class="flex flex-row items-center gap-2 overflow-hidden">
          <div class="flex items-center justify-center gap-2 font-medium">
            <img
              v-if="applicationGroupDetails.logo"
              :src="applicationGroupDetails.logo"
              class="h-4 w-4 rounded-sm"
              alt="logo" />
            {{ applicationGroupDetails.name }}
          </div>
        </div>
      </div>
      <!--     Status   -->
      <div class="text-center font-medium text-gray-800">
        <div class="flex flex-row items-center gap-5 px-3 text-center">
          <div class="flex flex-row items-center text-sm text-gray-700">
            <font-awesome-icon icon="fa-solid fa-boxes-stacked" class="me-1 text-info-500" />
            {{ totalServiceCount }}&nbsp;Services
          </div>
          <div class="flex flex-row items-center text-sm text-gray-700">
            <font-awesome-icon icon="fa-solid fa-heart-circle-check" class="me-1 text-success-500" />
            {{ healthyServiceCount }}&nbsp;Healthy
          </div>
          <div class="flex flex-row items-center text-sm text-gray-700">
            <font-awesome-icon icon="fa-solid fa-heart-circle-exclamation" class="me-1 text-danger-500" />
            {{ unhealthyServiceCount }}&nbsp;Unhealthy
          </div>
        </div>
      </div>
    </div>
    <!--  Second line  -->
    <div class="mt-3.5 flex w-full flex-row items-center justify-between">
      <div class="flex gap-2">
        <div class="flex items-center gap-2 text-gray-800">
          <div
            v-if="ingressRules.length > 0"
            class="deployment-head max-w-[40vw]"
            :class="{
              '!pr-0.5': ingressRules.length > 0
            }">
            <font-awesome-icon icon="fa-solid fa-globe" />
            <span v-for="(ingressRule, index) in ingressRules" :key="index">
              <a
                :href="
                  ingressRule.protocol +
                  '://' +
                  ((ingressRule.domain?.name || null) ?? 'proxy_server_ip') +
                  ':' +
                  ingressRule.port.toString()
                "
                target="_blank"
                class="has-popover rounded-full bg-primary-500 px-2 py-1 text-secondary-100">
                <font-awesome-icon icon="fa-solid fa-link" class="mr-0.5 text-xs" />
                Link {{ index + 1 }}
                <div class="popover">
                  {{
                    ingressRule.protocol +
                    '://' +
                    ((ingressRule.domain?.name || null) ?? 'proxy_server_ip') +
                    ':' +
                    ingressRule.port.toString()
                  }}
                </div>
              </a>
            </span>
          </div>
          <div v-else class="has-popover flex cursor-pointer gap-2">
            <div class="deployment-head">
              <font-awesome-icon icon="fa-solid fa-globe" />
              <p class="text-warning-600">Not Exposed</p>
            </div>
            <div class="popover w-60">
              No Ingress Rules available. Please open the <b>application details</b> page and create ingress rule to
              expose your application to the internet.
            </div>
          </div>
        </div>
      </div>
      <!--    Quick Actions    -->
      <div class="quick-actions">
        <div class="divider"></div>
        <div class="button" @click="rebuildApplications">
          <font-awesome-icon icon="fa-solid fa-hammer" class="mr-1" />
          Rebuild & Deploy
        </div>
        <div class="divider"></div>
        <div class="button" @click="restartApplications">
          <font-awesome-icon icon="fa-solid fa-rotate-right" class="mr-1" />
          Restart All
        </div>
        <div class="divider"></div>
        <div class="button text-danger-500" @click="deleteApplications">
          <font-awesome-icon icon="fa-solid fa-trash" class="mr-1" />
          Delete All
        </div>
      </div>
    </div>
    <!--  main section  -->
    <div class="mt-8 flex w-full flex-row gap-5">
      <!--   navbar   -->
      <div class="navbar">
        <div
          class="nav-element"
          :class="{
            'router-link-exact-active': pageName === 'deployed-apps'
          }"
          @click="pageName = 'deployed-apps'">
          Deployed Apps
        </div>
        <div
          class="nav-element"
          :class="{ 'router-link-exact-active': pageName === 'persistent-volume' }"
          @click="pageName = 'persistent-volume'">
          Persistent Volume
        </div>
        <div
          class="nav-element"
          :class="{ 'router-link-exact-active': pageName === 'environment-variables' }"
          @click="pageName = 'environment-variables'">
          Environment Variables
        </div>
        <div
          class="nav-element"
          :class="{ 'router-link-exact-active': pageName === 'static-app-config' }"
          @click="pageName = 'static-app-config'">
          Static App Config
        </div>
      </div>

      <!--    Deployed Apps  -->
      <div class="w-full">
        <Table v-if="pageName === 'deployed-apps'">
          <template v-slot:header>
            <TableHeader align="left">Application Name</TableHeader>
            <TableHeader align="center">Health Status</TableHeader>
            <TableHeader align="center">Replicas</TableHeader>
            <TableHeader align="center">Deploy Status</TableHeader>
            <TableHeader align="center">Last Deployment</TableHeader>
            <TableHeader align="right">View Details</TableHeader>
          </template>
          <template v-slot:message>
            <TableMessage v-if="applications.length === 0">
              No applications found, in this project.<br />
              You can attach your app to new project by in application details page.
            </TableMessage>
          </template>
          <template v-slot:body>
            <ApplicationListRow v-for="application in applications" :key="application.id" :application="application" />
          </template>
        </Table>
      </div>
    </div>
  </section>
</template>

<style scoped>
.deployment-head {
  @apply relative flex items-center justify-center gap-2.5  rounded-full border border-secondary-300 px-2 py-1 text-sm font-normal;
}

.quick-actions {
  @apply flex overflow-hidden rounded-full border border-secondary-300 text-sm  text-secondary-700;

  .button {
    @apply cursor-pointer px-2.5 py-1 hover:bg-secondary-200;
  }

  .divider {
    @apply h-auto w-[1px] bg-secondary-300;
  }
}

.navbar {
  @apply flex h-min select-none flex-col flex-wrap gap-1 rounded-lg border border-secondary-200 p-1.5;
}

.nav-element {
  @apply min-w-max cursor-pointer rounded-md px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-100;
}

.router-link-exact-active {
  @apply bg-secondary-100 font-medium text-black;
}
</style>
