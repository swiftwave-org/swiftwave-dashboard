<script setup>
import FilledButton from '@/views/components/FilledButton.vue'
import ModalDialog from '@/views/components/ModalDialog.vue'
import { computed, ref } from 'vue'
import { useLazyQuery, useMutation } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useToast } from 'vue-toastification'
import ComboBoxComponent from '@/views/components/ComboBoxComponent.vue'

const props = defineProps({
  applicationId: {
    type: String,
    required: true
  },
  currentGroup: {
    type: String,
    required: true
  },
  callbackOnUpdate: {
    type: Function,
    required: false,
    default: () => {}
  }
})

const toast = useToast()
const isModalOpen = ref(false)
const selectedGroup = ref('')

const openModal = () => {
  selectedGroup.value = props.currentGroup
  fetchApplicationGroups()
  isModalOpen.value = true
}
const closeModal = () => {
  isModalOpen.value = false
}

const {
  result: applicationGroupsRaw,
  load: loadApplicationGroups,
  refetch: refetchApplicationGroups,
  onError: onApplicationGroupLoadFail
} = useLazyQuery(gql`
  query {
    applicationGroups
  }
`)

onApplicationGroupLoadFail((error) => {
  toast.error(error.message)
})

const applicationGroups = computed(() => {
  let l = applicationGroupsRaw?.value?.applicationGroups ?? []
  l.push('No Group')
  return l
})

function fetchApplicationGroups() {
  if (loadApplicationGroups() === false) {
    refetchApplicationGroups()
  }
}

const {
  mutate: updateApplicationGroupRaw,
  loading: isDomainRegistering,
  onDone: onApplicationGroupUpdateSuccess,
  onError: onApplicationGroupUpdateFail
} = useMutation(gql`
  mutation ($id: String!, $group: String!) {
    updateApplicationGroup(id: $id, group: $group)
  }
`)

const updateApplicationGroup = () => {
  updateApplicationGroupRaw({
    id: props.applicationId,
    group: selectedGroup.value === 'No Group' ? '' : selectedGroup.value
  })
}

onApplicationGroupUpdateSuccess((val) => {
  if (val.data?.updateApplicationGroup) {
    toast.success('Application group updated')
    closeModal()
    props.callbackOnUpdate()
  } else {
    toast.error('Application group update failed')
  }
})

onApplicationGroupUpdateFail((err) => {
  toast.error(err.message)
})

defineExpose({
  openModal,
  closeModal
})
</script>

<template>
  <ModalDialog :close-modal="closeModal" :is-open="isModalOpen">
    <template v-slot:header>Update application group</template>
    <template v-slot:body>
      <p class="mb-4">Create a new group or pick an existing group to assign your application to.</p>
      <ComboBoxComponent :value="selectedGroup" :options="applicationGroups" :on-change="(e) => (selectedGroup = e)" />
    </template>
    <template v-slot:footer>
      <FilledButton
        class="w-full"
        :click="updateApplicationGroup"
        :loading="isDomainRegistering"
        type="primary"
        :disabled="selectedGroup === ''"
        >Assign Application to Group
      </FilledButton>
    </template>
  </ModalDialog>
</template>

<style scoped></style>
