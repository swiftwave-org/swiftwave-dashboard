<script setup>
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import Badge from '@/views/components/Badge.vue'
import StatusBadge from '@/views/components/StatusBadge.vue'
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
  <!-- <p class="w-full text-center font-semibold text-gray-900">🛠 Click on a deployment to view more details 🛠</p> -->

  <div class="scrollbox mt-4 flex max-h-[60vh] flex-col overflow-y-auto rows">
    <div class="w-full cursor-pointer  border-2 border-gray-200 p-4 deploy-row head-row">
      <div class="flex items-center gap-2 font-bold">
        Deploy ID
      </div>
      <div class="flex items-center gap-2 font-bold">
        Deploy Date
      </div>
      <div class="flex items-center gap-2 font-bold">
        Source
      </div>
      <div class="flex items-center gap-2 font-bold">
        Status
      </div>
    </div>
    <RouterLink v-for="deployment in deployments" :key="deployment.id" :to="{
      name: 'Application Deployment Details',
      params: {
        id: applicationId,
        deployment_id: deployment.id
      }
    }" class="w-full ">

      <div class="w-full cursor-pointer p-4 transition-all duration-100 ease-in-out hover:bg-gray-200 deploy-row">
        <div class="flex flex-col justify-center uppercase">
          <p>{{ deployment.id.split("-")[0] }}</p>
        </div>
        <div class="flex flex-col justify-center">
          <p>{{ formatdate(deployment.createdAt) }}</p>
        </div>

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

        <div class="status flex items-center">
          <!-- <div class="flex items-center gap-2" v-if="deployment.status === 'live'">
            <div class="indicator bg-success-500"></div>
            <p>{{ deployment.status }}</p>
          </div> -->

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
          <StatusBadge class="px-5 py-2" v-else-if="deployment.status === 'failed'" type="danger">{{ deployment.status
            }}
          </StatusBadge>
          <StatusBadge class="px-5 py-2" v-else-if="deployment.status === 'stopped'" type="secondary">{{
            deployment.status }}
          </StatusBadge>
          <StatusBadge class="px-5 py-2" v-else-if="deployment.status === 'stalled'" type="secondary">{{
            deployment.status }}</StatusBadge>
        </div>

      </div>
    </RouterLink>
  </div>
  <p class="mt-4 w-full text-center text-sm text-secondary-700">Scroll down to view more deployments(if any)</p>
</template>

<style scoped>
.circular {
  background: #ececec;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;

  border-radius: 15px;
  padding: 0 15px;

  gap: 10px;
}


.rows {
  border-radius: 15px;
  border: 2px solid;
  @apply border-gray-200;
}

.deploy-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr 2fr 1fr;
  border: 0;
  border-top: 2px solid;
  @apply border-gray-200;

  border-radius: 0px;
}

.head-row {
  border-top: none;
}



.indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 10px;
}
</style>
