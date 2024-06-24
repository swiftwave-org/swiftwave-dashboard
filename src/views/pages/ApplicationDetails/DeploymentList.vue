<script setup>
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import Badge from '@/views/components/Badge.vue'
import { Github, GitCommitVertical, GitBranch, Fingerprint, Upload, Building2 } from 'lucide-vue-next'
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

          <p v-if="deployment.upstreamType === 'git'" class="space-y-1">
          <div class="flex items-center gap-2">
            <GitBranch class="w-4 h-4" />
            <p class="text-sm">{{ deployment.repositoryBranch }}</p>
          </div>
          <div class="flex items-center gap-2">
            <GitCommitVertical class="w-4 h-4" />
            <p class="text-sm">Commit Message Placeholder</p>
          </div>
          <div class="flex items-center gap-2">
            <Fingerprint class="w-4 h-4" />
            <p class="text-sm">{{ deployment.commitHash.slice(0, 7) }}</p>
          </div>
          </p>
          <p v-if="deployment.upstreamType === 'image'" class="space-y-1">
          <div class="flex items-center gap-2">
            <Building2 class="w-4 h-4" />
            {{ deployment.dockerImage.split("/")[0] }}
          </div>
          <div class="flex items-center gap-2">
            <font-awesome-icon icon="fa-brands fa-docker" class="w-4 h-4" />
            {{ deployment.dockerImage.split("/")[1] }}
          </div>
          </p>
          <p v-if="deployment.upstreamType === 'sourceCode'" class="space-y-1">
          <div class="flex items-center gap-2">
            <Upload class="w-4 h-4" />
            <p>Source Uploaded Manually</p>
          </div>
          </p>
        </div>

        <div class="status flex items-center">
          <!-- <div class="flex items-center gap-2" v-if="deployment.status === 'live'">
            <div class="indicator bg-success-500"></div>
            <p>{{ deployment.status }}</p>
          </div> -->

          <Badge class="px-5 py-2" v-if="deployment.status === 'live'" type="success">{{ deployment.status }}
          </Badge>
          <Badge class="px-5 py-2" v-else-if="deployment.status === 'pending'" type="warning">{{
            deployment.status }}
          </Badge>
          <Badge class="px-5 py-2" v-else-if="deployment.status === 'deployPending'" type="warning">{{
            deployment.status
          }}
          </Badge>
          <Badge class="px-5 py-2" v-else-if="deployment.status === 'deploying'" type="warning">{{
            deployment.status }}
          </Badge>
          <Badge class="px-5 py-2" v-else-if="deployment.status === 'failed'" type="danger">{{ deployment.status
            }}
          </Badge>
          <Badge class="px-5 py-2" v-else-if="deployment.status === 'stopped'" type="secondary">{{
            deployment.status }}
          </Badge>
          <Badge class="px-5 py-2" v-else-if="deployment.status === 'stalled'" type="secondary">{{
            deployment.status }}</Badge>
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
  grid-template-columns: 1fr 2fr 2fr 0.5fr;
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
