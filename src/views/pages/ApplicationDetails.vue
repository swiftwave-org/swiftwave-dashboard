<script setup>
import { useRouter } from 'vue-router'
import { useMutation, useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed, ref } from 'vue'
import Badge from '@/views/components/Badge.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ApplicationDetailsNavbar from '@/views/partials/ApplicationDetailsNavbar.vue'
import NewApplicationUpdaterStore from '@/store/applicationUpdater.js'
import FilledButton from '@/views/components/FilledButton.vue'
import { useToast } from 'vue-toastification'
import { isNaN } from 'lodash'
import UptimeChart from '@/views/components/UptimeChart.vue'
import UpdateApplicationGroupModal from '@/views/partials/UpdateApplicationGroupModal.vue'

// Toast
const toast = useToast()

// Get the application ID from the URL
const router = useRouter()
const applicationId = router.currentRoute.value.params.id

// Fetch the application details
const {
  result: applicationDetailsRaw,
  loading: applicationDetailsLoading,
  refetch: refetchApplicationDetails
} = useQuery(
  gql`
    query ($id: String!) {
      application(id: $id) {
        id
        name
        isDeleted
        deploymentMode
        replicas
        isSleeping
        realtimeInfo {
          InfoFound
          DesiredReplicas
          RunningReplicas
          DeploymentMode
        }
        latestDeployment {
          id
          status
          upstreamType
          dockerImage
          gitProvider
          repositoryName
          repositoryOwner
          repositoryBranch
          codePath
          createdAt
        }
        ingressRules {
          domain {
            name
          }
          protocol
          port
        }
        group
      }
    }
  `,
  {
    id: applicationId
  },
  {
    pollInterval: 10000
  }
)

const applicationDetails = computed(() => applicationDetailsRaw.value?.application ?? {})
const realtimeInfo = computed(() => applicationDetailsRaw.value?.application?.realtimeInfo ?? {})
const realtimeReplicaCountPercentage = computed(() => {
  try {
    return (realtimeInfo.value.RunningReplicas / applicationDetails.value.replicas) * 100
  } catch (e) {
    return 0
  }
})
const deploymentMode = computed(() => applicationDetails.value?.deploymentMode ?? '')

const isIngressRulesAvailable = computed(() => {
  return (applicationDetails.value?.ingressRules ?? []).length > 0
})

// Environment variables editor
const applicationUpdater = NewApplicationUpdaterStore(applicationId)()

// App Doze Mode
const {
  mutate: sleepApplication,
  loading: sleepApplicationLoading,
  onDone: onSleepApplicationDone,
  onError: onSleepApplicationError
} = useMutation(
  gql`
    mutation ($id: String!) {
      sleepApplication(id: $id)
    }
  `,
  {
    variables: {
      id: applicationId
    }
  }
)

onSleepApplicationDone(() => {
  toast.success('Application will be paused in a few seconds')
  refetchApplicationDetails()
})

onSleepApplicationError((error) => {
  toast.error(error.message)
})

const {
  mutate: wakeApplication,
  loading: wakeApplicationLoading,
  onDone: onWakeApplicationDone,
  onError: onWakeApplicationError
} = useMutation(
  gql`
    mutation ($id: String!) {
      wakeApplication(id: $id)
    }
  `,
  {
    variables: {
      id: applicationId
    }
  }
)

onWakeApplicationDone(() => {
  toast.success('Application will be resumed in a few seconds')
  refetchApplicationDetails()
})

onWakeApplicationError((error) => {
  toast.error(error.message)
})

// Application group update
const applicationGroupUpdateModalRef = ref(null)
const openApplicationGroupUpdateModal = () => {
  if (applicationGroupUpdateModalRef.value) applicationGroupUpdateModalRef.value.openModal()
}
</script>

<template>
  <!-- Application group update modal -->
  <UpdateApplicationGroupModal
    ref="applicationGroupUpdateModalRef"
    :current-group="applicationDetails.group"
    :application-id="applicationDetails.id"
    :callback-on-update="refetchApplicationDetails" />

  <!-- Main -->
  <div v-if="applicationDetailsLoading">
    <p>Loading...</p>
  </div>
  <section v-else class="mx-auto w-full max-w-7xl">
    <div class="flex flex-row justify-between">
      <!--   left side   -->
      <div>
        <div class="flex items-center gap-2">
          <div class="flex overflow-hidden rounded-full border-2 border-secondary-300 text-base">
            <div class="flex items-center justify-center gap-2 py-1 pl-3 pr-2 font-medium">
              {{ applicationDetails.name }}
              <Badge v-if="applicationDetails.latestDeployment.status === 'live'" type="success">
                {{ applicationDetails.latestDeployment.status }}
              </Badge>
              <Badge v-else-if="applicationDetails.latestDeployment.status === 'pending'" type="warning">
                {{ applicationDetails.latestDeployment.status }}
              </Badge>
              <Badge v-else-if="applicationDetails.latestDeployment.status === 'deployPending'" type="warning">
                {{ applicationDetails.latestDeployment.status }}
              </Badge>
              <Badge v-else-if="applicationDetails.latestDeployment.status === 'deploying'" type="warning">
                {{ applicationDetails.latestDeployment.status }}
              </Badge>
              <Badge v-else-if="applicationDetails.latestDeployment.status === 'failed'" type="danger">
                {{ applicationDetails.latestDeployment.status }}
              </Badge>
              <Badge v-else-if="applicationDetails.latestDeployment.status === 'stopped'" type="secondary">
                {{ applicationDetails.latestDeployment.status }}
              </Badge>
              <Badge v-else-if="applicationDetails.latestDeployment.status === 'stalled'" type="secondary">
                {{ applicationDetails.latestDeployment.status }}
              </Badge>
              <Badge v-if="applicationDetails.isSleeping" type="warning"> Sleeping</Badge>
            </div>
            <div
              @click="openApplicationGroupUpdateModal"
              class="flex cursor-pointer items-center justify-center rounded-full bg-primary-600 px-3 py-1 text-sm font-medium italic text-white hover:bg-primary-500">
              <span v-if="applicationDetails.group !== ''">{{ applicationDetails.group }}</span>
              <span v-else>no group</span>
              &nbsp;&nbsp;
              <font-awesome-icon icon="fa-solid fa-caret-down" />
            </div>
          </div>
        </div>
        <div class="mt-3 flex gap-2">
          <div class="flex items-center gap-2 font-medium text-gray-800">
            <div v-if="applicationDetails.latestDeployment.upstreamType === 'git'" class="flex gap-2">
              <div class="deployment-head">
                <font-awesome-icon
                  v-if="applicationDetails.latestDeployment.upstreamType === 'git'"
                  icon="fa-brands fa-github" />
                <font-awesome-icon
                  v-if="applicationDetails.latestDeployment.upstreamType === 'image'"
                  icon="fa-brands fa-docker" />
                <font-awesome-icon
                  v-if="applicationDetails.latestDeployment.upstreamType === 'sourceCode'"
                  icon="fa-solid fa-upload" />

                {{ applicationDetails.latestDeployment.repositoryOwner }}/{{
                  applicationDetails.latestDeployment.repositoryName
                }}
              </div>
              <div class="deployment-head">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="lucide lucide-git-branch h-4 w-4">
                  <line x1="6" x2="6" y1="3" y2="15" />
                  <circle cx="18" cy="6" r="3" />
                  <circle cx="6" cy="18" r="3" />
                  <path d="M18 9a9 9 0 0 1-9 9" />
                </svg>
                {{ applicationDetails.latestDeployment.repositoryBranch }}
              </div>
            </div>
            <p v-if="applicationDetails.latestDeployment.upstreamType === 'image'" class="deployment-head">
              <font-awesome-icon icon="fa-brands fa-docker" />
              {{ applicationDetails.latestDeployment.dockerImage }}
            </p>
            <p v-if="applicationDetails.latestDeployment.upstreamType === 'sourceCode'" class="deployment-head">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-upload h-4 w-4">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
              Source-code uploaded manually
            </p>
          </div>
          <div class="flex items-center gap-2 font-normal text-gray-800">
            <p v-if="isIngressRulesAvailable" class="deployment-head max-w-[40vw]">
              <font-awesome-icon icon="fa-solid fa-globe" />
              <span v-for="(ingressRule, index) in applicationDetails.ingressRules" :key="index">
                <a
                  :href="
                    ingressRule.protocol +
                    '://' +
                    ((ingressRule.domain?.name || null) ?? 'server_ip') +
                    ':' +
                    ingressRule.port.toString()
                  "
                  target="_blank"
                  class="has-popover rounded-full bg-primary-500 px-3 py-1 text-sm text-secondary-100">
                  <font-awesome-icon :icon="['fas', 'link']" />
                  Link {{ index + 1 }}
                  <div class="popover">
                    {{
                      ingressRule.protocol +
                      '://' +
                      ((ingressRule.domain?.name || null) ?? 'server_ip') +
                      ':' +
                      ingressRule.port.toString()
                    }}
                  </div>
                </a>
              </span>
            </p>
            <div v-else class="flex gap-2">
              <div class="deployment-head has-popover">
                <font-awesome-icon icon="fa-solid fa-globe" />
                <b class="font-normal text-warning-600">Not Exposed</b>
                <RouterLink
                  :to="{
                    name: 'Application Details Ingress Rules',
                    params: { id: $route.params.id }
                  }"
                  class="font-semibold hover:cursor-pointer hover:text-primary-600">
                  <font-awesome-icon icon="fa-solid fa-plus" />
                </RouterLink>
                <div class="popover">
                  No Ingress Rules available. Click the plus button to add ingress rules if you want to expose the
                  application to the internet.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!--   right side   -->
      <div class="flex flex-col items-end">
        <div class="mt-2 flex w-full items-center gap-2 text-center font-medium text-gray-800">
          <p v-if="applicationDetails.isSleeping" class="my-2 w-full text-center font-semibold text-blue-600">
            <font-awesome-icon icon="fa-solid fa-bed" />
            Sleeping
          </p>
          <div v-else-if="realtimeInfo.InfoFound" class="flex w-full flex-col items-center text-center">
            <UptimeChart
              v-if="!isNaN(realtimeReplicaCountPercentage) && deploymentMode === 'replicated'"
              :percentage="realtimeReplicaCountPercentage"
              :label="`(${realtimeInfo.RunningReplicas ?? 0} / ${applicationDetails.replicas})`" />
            <p v-else-if="deploymentMode === 'global'" class="w-full text-center font-semibold text-secondary-600">
              {{ realtimeInfo.RunningReplicas ?? 0 }} Instances
            </p>
            <p v-else class="text-warning-600">Not Available</p>
          </div>
          <p v-else class="text-warning-600">
            <font-awesome-icon icon="fa-solid fa-triangle-exclamation" />&nbsp;&nbsp;Not Available
          </p>
        </div>
        <div class="mt-3 w-full">
          <FilledButton
            v-if="applicationDetails.isSleeping"
            class="w-full"
            type="primary"
            :loading="wakeApplicationLoading"
            :click="wakeApplication"
            :disabled="applicationDetails.latestDeployment.status !== 'live'">
            <font-awesome-icon class="mr-2" icon="fa-solid fa-play" />
            Resume App
          </FilledButton>
          <FilledButton
            v-else
            class="w-full"
            type="primary"
            :loading="sleepApplicationLoading"
            :click="sleepApplication"
            :disabled="applicationDetails.latestDeployment.status !== 'live'">
            <font-awesome-icon class="mr-2" icon="fa-solid fa-circle-stop" />
            Pause App
          </FilledButton>
        </div>
      </div>
    </div>
    <div class="mt-8 flex w-full flex-row gap-5">
      <!--  Vertical navbar for links    -->
      <ApplicationDetailsNavbar />

      <div class="w-full">
        <!--  Nested Router View  -->
        <RouterView />
        <!--  Update Config Notify bar  -->
        <div
          v-if="applicationUpdater.isConfigurationUpdated"
          class="mt-4 flex flex-row items-center justify-end gap-2 rounded-md border border-gray-300 p-2">
          <span class="mr-4 font-medium">You have updated some of the configuration</span>
          <FilledButton
            :click="applicationUpdater.applyConfigurationChanges"
            :loading="applicationUpdater.isDeployRequestSubmitting"
            type="primary">
            Apply Changes
          </FilledButton>
          <FilledButton
            :click="applicationUpdater.cancelConfigurationChanges"
            :disabled="applicationUpdater.isDeployRequestSubmitting"
            type="secondary">
            Cancel
          </FilledButton>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.deployment-head {
  @apply relative flex items-center justify-center gap-2.5 rounded-full bg-secondary-100 px-4 py-2 font-normal;
}
</style>
