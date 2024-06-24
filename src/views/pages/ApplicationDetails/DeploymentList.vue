<script setup>
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import StatusBadge from '@/views/components/StatusBadge.vue'
import TableHeader from '@/views/components/Table/TableHeader.vue'
import TableMessage from '@/views/components/Table/TableMessage.vue'
import Table from '@/views/components/Table/Table.vue'
import TableRow from '@/views/components/Table/TableRow.vue'
import { camelCaseToSpacedCapitalized } from '../../../vendor/utils.js'

const router = useRouter()
const toast = useToast()

const applicationId = router.currentRoute.value.params.id

// Fetch ingress rules
const { result: ingressRulesRaw, onError: onDeploymentsError } = useQuery(
  gql`
    query ($id: String!) {
      application(id: $id) {
        deployments {
          id
          status
          upstreamType
          gitProvider
          commitHash
          commitMessage
          dockerImage
          repositoryName
          repositoryOwner
          repositoryBranch
          createdAt
        }
      }
    }
  `,
  {
    id: router.currentRoute.value.params.id
  },
  {
    pollInterval: 10000
  }
)

const deployments = computed(() => ingressRulesRaw.value?.application?.deployments ?? [])

onDeploymentsError((err) => {
  toast.error(err.message)
})

const formatdate = (date) => {
  const x = new Date(date)
  return x.toLocaleString()
}
</script>

<template>
  <Table class="">
    <template v-slot:header>
      <TableHeader align="left">Deployment ID</TableHeader>
      <TableHeader align="left">Deploy Date</TableHeader>
      <TableHeader align="left">Source</TableHeader>
      <TableHeader align="center">Current Status</TableHeader>
    </template>
    <template v-slot:message>
      <TableMessage v-if="deployments.length === 0">
        No deployed applications found.<br />
        Click on the "Deploy New" button to deploy a new application.
      </TableMessage>
    </template>
    <template v-slot:body>
      <tr v-for="deployment in deployments" :key="deployment.id" class="text-sm text-secondary-700">
        <TableRow align="left" flex>
          <RouterLink
            :to="{
              name: 'Application Deployment Details',
              params: {
                id: applicationId,
                deployment_id: deployment.id
              }
            }"
            class="w-full">
            <div class="cursor-pointer text-secondary-900 hover:text-primary-500">
              {{ deployment.id.split('-')[0] }}
            </div>
          </RouterLink>
        </TableRow>
        <TableRow align="left" flex>
          <div>{{ formatdate(deployment.createdAt) }}</div>
        </TableRow>
        <TableRow align="left" flex>
          <div class="flex flex-row items-center gap-2">
            <div v-if="deployment.upstreamType === 'git'" class="space-y-1">
              <div class="flex items-center gap-2">
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
                  class="h-4 w-4">
                  <line x1="6" x2="6" y1="3" y2="15" />
                  <circle cx="18" cy="6" r="3" />
                  <circle cx="6" cy="18" r="3" />
                  <path d="M18 9a9 9 0 0 1-9 9" />
                </svg>
                <p>{{ deployment.repositoryBranch }}</p>
              </div>
              <div class="has-popover flex items-center gap-2">
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
                  class="h-4 w-4">
                  <circle cx="12" cy="12" r="3" />
                  <line x1="3" x2="9" y1="12" y2="12" />
                  <line x1="15" x2="21" y1="12" y2="12" />
                </svg>
                <p>{{ deployment.commitHash.slice(0, 7) }}</p>
                <p class="nowrap max-w-[200px] overflow-hidden text-ellipsis">
                  {{ deployment.commitMessage }}
                </p>
                <div class="popover top-[calc(-100%-10px)] px-2 py-1">{{ deployment.commitMessage }}</div>
              </div>
            </div>
            <div v-if="deployment.upstreamType === 'image'" class="space-y-1">
              <div class="flex items-center gap-2">
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
                  class="h-4 w-4">
                  <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                  <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                  <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                  <path d="M10 6h4" />
                  <path d="M10 10h4" />
                  <path d="M10 14h4" />
                  <path d="M10 18h4" />
                </svg>
                {{ deployment.dockerImage.split('/')[0] }}
              </div>
              <div class="flex items-center gap-2">
                <font-awesome-icon icon="fa-brands fa-docker" class="h-4 w-4" />
                {{ deployment.dockerImage.split('/')[1] }}
              </div>
            </div>
            <div v-if="deployment.upstreamType === 'sourceCode'" class="space-y-1">
              <div class="flex items-center gap-2">
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
                  class="h-4 w-4">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                <p>Source Uploaded Manually</p>
              </div>
            </div>
          </div>
        </TableRow>
        <TableRow flex align="center" class="text-secondary-900">
          <StatusBadge v-if="deployment.status === 'live'" type="success"
            >{{ camelCaseToSpacedCapitalized(deployment.status) }}
          </StatusBadge>
          <StatusBadge v-else-if="deployment.status === 'pending'" type="warning"
            >{{ camelCaseToSpacedCapitalized(deployment.status) }}
          </StatusBadge>
          <StatusBadge v-else-if="deployment.status === 'deployPending'" type="warning"
            >{{ camelCaseToSpacedCapitalized(deployment.status) }}
          </StatusBadge>
          <StatusBadge v-else-if="deployment.status === 'deploying'" type="warning"
            >{{ camelCaseToSpacedCapitalized(deployment.status) }}
          </StatusBadge>
          <StatusBadge v-else-if="deployment.status === 'failed'" type="danger"
            >{{ camelCaseToSpacedCapitalized(deployment.status) }}
          </StatusBadge>
          <StatusBadge v-else-if="deployment.status === 'stopped'" type="secondary"
            >{{ camelCaseToSpacedCapitalized(deployment.status) }}
          </StatusBadge>
          <StatusBadge v-else-if="deployment.status === 'stalled'" type="secondary"
            >{{ camelCaseToSpacedCapitalized(deployment.status) }}
          </StatusBadge>
        </TableRow>
      </tr>
    </template>
  </Table>
</template>

<style scoped></style>
