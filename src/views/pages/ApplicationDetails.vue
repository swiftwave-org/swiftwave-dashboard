<script setup>
import { useRouter } from 'vue-router'
import { useMutation, useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed } from 'vue'
import Badge from '@/views/components/Badge.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ApplicationDetailsNavbar from '@/views/partials/ApplicationDetailsNavbar.vue'
import NewApplicationUpdaterStore from '@/store/applicationUpdater.js'
import FilledButton from '@/views/components/FilledButton.vue'
import { useToast } from 'vue-toastification'
import { isNaN } from 'lodash'
import UptimeChart from '@/views/components/UptimeChart.vue'

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
</script>

<template>
  <div v-if="applicationDetailsLoading">
    <p>Loading...</p>
  </div>
  <section v-else class="mx-auto w-full max-w-7xl">
    <div class="flex flex-row justify-between">
      <!--   left side   -->
      <div>
        <div class="flex items-center gap-2">
          <p class="text-xl font-medium">{{ applicationDetails.name }}</p>
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
        <div class="mt-2 flex items-center gap-2 font-medium text-gray-800">
          <font-awesome-icon
            v-if="applicationDetails.latestDeployment.upstreamType === 'git'"
            icon="fa-solid fa-code-branch" />
          <font-awesome-icon
            v-if="applicationDetails.latestDeployment.upstreamType === 'image'"
            icon="fa-brands fa-docker" />
          <font-awesome-icon
            v-if="applicationDetails.latestDeployment.upstreamType === 'sourceCode'"
            icon="fa-solid fa-upload" />

          <p v-if="applicationDetails.latestDeployment.upstreamType === 'git'">
            {{ applicationDetails.latestDeployment.gitProvider }}@{{
              applicationDetails.latestDeployment.repositoryOwner
            }}/{{ applicationDetails.latestDeployment.repositoryName }}:{{
              applicationDetails.latestDeployment.repositoryBranch
            }}
          </p>
          <p v-if="applicationDetails.latestDeployment.upstreamType === 'image'">
            {{ applicationDetails.latestDeployment.dockerImage }}
          </p>
          <p v-if="applicationDetails.latestDeployment.upstreamType === 'sourceCode'">Source-code uploaded manually</p>
        </div>
        <div class="mt-2 flex items-center gap-2 font-normal text-gray-800">
          <font-awesome-icon icon="fa-solid fa-globe" />
          <p v-if="isIngressRulesAvailable" class="max-w-[40vw]">
            <span v-for="(ingressRule, index) in applicationDetails.ingressRules" :key="index">
              <span v-if="index !== 0">, </span>
              <a
                :href="
                  ingressRule.protocol + '://' + ingressRule.domain?.name ??
                  'server_ip' + ':' + ingressRule.port.toString()
                "
                target="_blank"
                >{{ ingressRule.protocol }}://{{ ingressRule.domain?.name ?? 'server_ip' }}:{{ ingressRule.port }}</a
              >
            </span>
          </p>
          <p v-else>
            <b class="text-warning-600">No Ingress Rules ! </b
            ><i
              >(
              <RouterLink
                :to="{
                  name: 'Application Details Ingress Rules',
                  params: { id: $route.params.id }
                }"
                class="font-semibold text-info-600"
                >Add ingress rules
              </RouterLink>
              if you want to expose the application to the internet)</i
            >
          </p>
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

<style scoped></style>
