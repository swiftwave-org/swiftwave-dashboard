<script setup>
import { useRouter } from 'vue-router'
import FilledButton from '@/views/components/FilledButton.vue'
import { useMutation } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useToast } from 'vue-toastification'

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
</script>

<template>
  <div class="w-full rounded-md border border-warning-200 bg-warning-100 p-2">
    Use the below options with caution. These actions are non-reversible.
  </div>
  <div class="mt-3 w-full rounded-md border border-danger-200 bg-danger-100 p-2">
    <b>Note :</b> You need to delete all the ingress rules pointed to this application manually before deleting this
    application.
  </div>
  <div class="mt-3 flex flex-col items-start">
    <p class="font-bold text-danger-500">Do you like to delete this application ?</p>
    <p class="mt-2">This action will remove these stuffs -</p>
    <ul class="list-inside list-disc">
      <li>Application</li>
      <li>Related Deployments</li>
      <li>Deployment Logs</li>
      <li>Environment Variables</li>
      <li>Persistent Volume Bindings</li>
      <li>Uploaded Source Code</li>
    </ul>

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
