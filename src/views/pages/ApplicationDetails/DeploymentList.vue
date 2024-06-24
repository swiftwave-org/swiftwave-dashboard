<script setup>
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import Badge from '@/views/components/Badge.vue'
import StatusBadge from '@/views/components/StatusBadge.vue'
import TableHeader from '@/views/components/Table/TableHeader.vue'
import TableMessage from '@/views/components/Table/TableMessage.vue'
import Table from '@/views/components/Table/Table.vue'
import TableRow from '@/views/components/Table/TableRow.vue'
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
  <!-- <p class="w-full text-center font-semibold text-gray-900">🛠 Click on a deployment ID to view more details 🛠</p> -->
  <Table class="">
    <template v-slot:header>
      <TableHeader align="left">Deployment ID</TableHeader>
      <TableHeader align="left">Deploy Date</TableHeader>
      <TableHeader align="left">Source</TableHeader>
      <TableHeader align="center">Status</TableHeader>
    </template>
    <template v-slot:message>
      <TableMessage v-if="deployments.length === 0">
        No deployed applications found.<br />
        Click on the "Deploy New" button to deploy a new application.
      </TableMessage>

    </template>
    <template v-slot:body>
      <tr v-for="deployment in deployments" :key="deployment.id">
        <TableRow align="left" flex>
          <RouterLink :to="{
            name: 'Application Deployment Details',
            params: {
              id: applicationId,
              deployment_id: deployment.id
            }
          }" class="w-full ">
            <div class="text-sm hover:text-primary-500 cursor-pointer">{{ deployment.id.split("-")[0] }}</div>
          </RouterLink>
        </TableRow>
        <TableRow align="left" flex>
          <div class="text-sm">{{ formatdate(deployment.createdAt) }}</div>
        </TableRow>
        <TableRow align="left" flex>
          <div class="flex flex-row items-center gap-2">

            <p v-if="deployment.upstreamType === 'git'" class="space-y-1 ">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-git-branch w-4 h-4">
                <line x1="6" x2="6" y1="3" y2="15" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <path d="M18 9a9 9 0 0 1-9 9" />
              </svg />
              <p class="text-sm">{{ deployment.repositoryBranch }}</p>
            </div>
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-git-commit-horizontal w-4 h-4">
                <circle cx="12" cy="12" r="3" />
                <line x1="3" x2="9" y1="12" y2="12" />
                <line x1="15" x2="21" y1="12" y2="12" />
              </svg>
              <p class="text-sm">{{ deployment.commitHash.slice(0, 7) }}</p>
              <p class="text-sm">Commit Message Placeholder</p>
            </div>
            </p>
            <p v-if="deployment.upstreamType === 'image'" class="space-y-1">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-building-2 h-4 w-4">
                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                <path d="M10 6h4" />
                <path d="M10 10h4" />
                <path d="M10 14h4" />
                <path d="M10 18h4" />
              </svg>
              {{ deployment.dockerImage.split("/")[0] }}
            </div>
            <div class="flex items-center gap-2">
              <font-awesome-icon icon="fa-brands fa-docker" class="w-4 h-4" />
              {{ deployment.dockerImage.split("/")[1] }}
            </div>
            </p>
            <p v-if="deployment.upstreamType === 'sourceCode'" class="space-y-1">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-upload w-4 h-4">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
              <p>Source Uploaded Manually</p>
            </div>
            </p>
          </div>
        </TableRow>
        <TableRow>
          <div class="status flex items-center text-sm">
            <StatusBadge class="px-5 py-2" v-if="deployment.status === 'live'" type="success">{{ deployment.status }}
            </StatusBadge>
            <StatusBadge class="px-5 py-2" v-else-if="deployment.status === 'pending'" type="warning">{{
              deployment.status }}
            </StatusBadge>
            <StatusBadge class="px-5 py-2" v-else-if="deployment.status === 'deployPending'" type="warning">{{
              deployment.status
            }}
            </StatusBadge>
            <StatusBadge class="px-5 py-2" v-else-if="deployment.status === 'deploying'" type="warning">{{
              deployment.status }}
            </StatusBadge>
            <StatusBadge class="px-5 py-2" v-else-if="deployment.status === 'failed'" type="danger">{{
              deployment.status
            }}
            </StatusBadge>
            <StatusBadge class="px-5 py-2" v-else-if="deployment.status === 'stopped'" type="secondary">{{
              deployment.status }}
            </StatusBadge>
            <StatusBadge class="px-5 py-2" v-else-if="deployment.status === 'stalled'" type="secondary">{{
              deployment.status }}</StatusBadge>
          </div>
        </TableRow>
      </tr>
    </template>
  </Table>
  <p class="mt-4 w-full text-center text-sm text-secondary-700">Scroll down to view more deployments(if any)</p>
</template>

<style scoped></style>
