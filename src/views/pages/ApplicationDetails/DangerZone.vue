<script setup>
import { useRouter } from 'vue-router'
import FilledButton from '@/views/components/FilledButton.vue'
import { useMutation } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useToast } from 'vue-toastification'
import { getHttpBaseUrl } from '@/vendor/utils.js'
import Divider from '@/views/components/Divider.vue'

const router = useRouter()
const toast = useToast()

const {
  mutate: deleteApplication,
  loading: deleteApplicationLoading,
  onError: deleteApplicationError,
  onDone: deleteApplicationDone
} = useMutation(gql`
  mutation ($id: String!) {
    deleteApplication(id: $id)
  }
`)

function deleteApplicationWithConfirmation() {
  // ask to type `delete` to confirm
  const confirmation = prompt('Type `delete` to confirm')
  if (confirmation === 'delete') {
    deleteApplication({
      id: router.currentRoute.value.params.id
    })
  } else {
    alert('Retry again !')
  }
}

deleteApplicationDone((result) => {
  console.log(result)
  if (result.data.deleteApplication) {
    toast.success('Application deleted successfully !')
    router.push('/applications')
  } else {
    toast.error('Something went wrong !')
  }
})

deleteApplicationError((error) => {
  toast.error(error.message)
})

// Restart Application
const {
  mutate: restartApplication,
  loading: restartApplicationLoading,
  onError: restartApplicationError,
  onDone: restartApplicationDone
} = useMutation(
  gql`
    mutation ($id: String!) {
      restartApplication(id: $id)
    }
  `,
  {
    fetchPolicy: 'no-cache',
    variables: {
      id: router.currentRoute.value.params.id
    }
  }
)

restartApplicationDone((result) => {
  if (result.data.restartApplication) {
    toast.success('Application restarted successfully !')
  } else {
    toast.error('Something went wrong !')
  }
})

restartApplicationError((error) => {
  toast.error(error.message)
})

const restartApplicationWithConfirmation = () => {
  const confirmation = confirm('Are you sure that you want to restart this application ?')
  if (confirmation) {
    restartApplication()
  }
}

// Rebuild Application
const {
  mutate: rebuildApplication,
  loading: rebuildApplicationLoading,
  onError: rebuildApplicationError,
  onDone: rebuildApplicationDone
} = useMutation(
  gql`
    mutation ($id: String!) {
      rebuildApplication(id: $id)
    }
  `,
  {
    fetchPolicy: 'no-cache',
    variables: {
      id: router.currentRoute.value.params.id
    }
  }
)

rebuildApplicationDone((result) => {
  if (result.data.rebuildApplication) {
    toast.success('Application rebuild request sent successfully !')
  } else {
    toast.error('Something went wrong !')
  }
  router.push({
    name: 'Application Details Deployments',
    params: {
      id: router.currentRoute.value.params.id
    }
  })
})

rebuildApplicationError((error) => {
  toast.error(error.message)
})

const rebuildApplicationWithConfirmation = () => {
  const confirmation = confirm('Are you sure that you want to rebuild this application ?')
  if (confirmation) {
    rebuildApplication()
  }
}

const openWebConsole = () => {
  const height = window.innerHeight * 0.7
  const width = window.innerWidth * 0.6
  const url = `${getHttpBaseUrl()}/console?application=${router.currentRoute.value.params.id}`
  window.open(url, '', `popup,height=${height},width=${width}`)
}
</script>

<template>
  <div class="mt-3 w-full rounded-md border border-warning-200 bg-warning-100 p-2">
    Use the below options with caution. These actions are non-reversible.
  </div>
  <div class="mt-3 flex flex-col items-start">
    <div class="flex w-full flex-row items-center justify-between rounded-md p-2">
      <div>
        <p class="inline-flex items-center gap-2 text-lg font-medium">
          <font-awesome-icon icon="fa-solid fa-terminal" />&nbsp;SSH Shell
        </p>
        <p class="text-sm text-secondary-700">You can access the shell of the container running this application.</p>
      </div>
      <FilledButton type="primary" @click="openWebConsole"> Open Web Console</FilledButton>
    </div>

    <Divider />

    <div class="flex w-full flex-row items-center justify-between rounded-md p-2">
      <div>
        <p class="inline-flex items-center gap-2 text-lg font-medium">Restart Application</p>
        <p class="text-sm text-secondary-700">
          This will restart all the deployments of this application. <b>Your application will be down for a while.</b>
        </p>
      </div>
      <FilledButton type="primary" @click="restartApplicationWithConfirmation" :loading="restartApplicationLoading">
        Click to Restart
      </FilledButton>
    </div>

    <div class="flex w-full flex-row items-center justify-between rounded-md p-2">
      <div>
        <p class="inline-flex items-center gap-2 text-lg font-medium">Rebuild Application</p>
        <p class="text-sm text-secondary-700">This will trigger a new deployment with the latest source code.</p>
      </div>
      <FilledButton type="primary" @click="rebuildApplicationWithConfirmation" :loading="rebuildApplicationLoading">
        Click to Rebuild
      </FilledButton>
    </div>
    <Divider />
    <p class="font-bold text-danger-500">Do you like to delete this application ?</p>
    <p class="mt-2">This action will remove these stuffs-</p>
    <ul class="list-inside list-disc">
      <li>Application</li>
      <li>Related Deployments</li>
      <li>Deployment Logs</li>
      <li>Environment Variables</li>
      <li>Persistent Volume Bindings</li>
      <li>Uploaded Source Code</li>
    </ul>

    <div class="mt-3 w-full rounded-md border border-danger-200 bg-danger-100 p-2">
      <b>Note :</b> You need to delete all the ingress rules pointed to this application manually before deleting this
      application.
    </div>

    <FilledButton
      class="mt-6"
      type="danger"
      :loading="deleteApplicationLoading"
      :click="deleteApplicationWithConfirmation"
      >Confirm & Delete Application
    </FilledButton>
  </div>
</template>

<style scoped></style>
