<script setup>
// Toast
import { useQuery } from '@vue/apollo-composable'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import gql from 'graphql-tag'
import { computed } from 'vue'

const toast = useToast()

// Get the application ID from the URL
const router = useRouter()
const applicationGroupId = router.currentRoute.value.params.id

// Fetch the application details
const {
  result: applicationGroupDetailsRaw,
  loading: applicationGroupDetailsLoading,
  refetch: refetchGroupApplicationDetails
} = useQuery(
  gql`
    query ($id: String!) {
      applicationGroup(id: $id) {
        id
        name
        logo
        applications {
          id
          isSleeping
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

const applicationGroupDetails = computed(() => applicationGroupDetailsRaw.value?.applicationGroup ?? {})
const applications = computed(() => applicationGroupDetailsRaw.value?.applicationGroup?.applications ?? [])
</script>

<template>
  <!-- Main -->
  <div v-if="applicationGroupDetailsLoading">
    <p>Loading...</p>
  </div>
  <section v-else class="mx-auto w-full max-w-7xl">
    <div class="flex flex-row justify-between">
      <!--   left side   -->
      <div>
        <div class="flex items-center gap-2">
          <div class="flex items-center justify-center gap-2 py-1 pl-3 pr-2 font-medium">
            {{ applicationGroupDetails.name }}
          </div>
        </div>
      </div>
      <!--   right side   -->
      <div class="flex flex-col items-end">
        <div class="mt-2 flex w-full items-center gap-2 text-center font-medium text-gray-800">
          <!--          <UptimeChart-->
          <!--            v-if="!isNaN(realtimeReplicaCountPercentage) && deploymentMode === 'replicated'"-->
          <!--            :percentage="realtimeReplicaCountPercentage"-->
          <!--            :label="`(${realtimeInfo.RunningReplicas ?? 0} / ${applicationDetails.replicas})`" />-->
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped></style>
