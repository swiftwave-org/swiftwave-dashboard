<script setup>
import { useRouter } from 'vue-router'
import newApplicationUpdater from '@/store/applicationUpdater.js'
import TableHeader from '@/views/components/Table/TableHeader.vue'
import Table from '@/views/components/Table/Table.vue'
import TableMessage from '@/views/components/Table/TableMessage.vue'
import TextButton from '@/views/components/TextButton.vue'
import TableRow from '@/views/components/Table/TableRow.vue'
import FilledButton from '@/views/components/FilledButton.vue'
import { ref } from 'vue'
import ModalDialog from '@/views/components/ModalDialog.vue'
import Code from '@/views/components/Code.vue'
import CreateConfigMountModal from '@/views/partials/CreateConfigMountModal.vue'

const router = useRouter()
const applicationUpdater = newApplicationUpdater(router.currentRoute.value.params.id)()
const selectedConfigId = ref(null)
const isConfigViewModalOpen = ref(false)
const closeConfigModal = () => {
  isConfigViewModalOpen.value = false
  selectedConfigId.value = null
}
const openConfigModal = (configId) => {
  selectedConfigId.value = configId
  isConfigViewModalOpen.value = true
}
const isEditConfigModalOpen = ref(false)
const closeEditConfigModal = () => {
  isEditConfigModalOpen.value = false
}
const openEditConfigModal = (configId) => {
  selectedConfigId.value = configId
  isEditConfigModalOpen.value = true
}
const createConfigMountModalRef = ref(null)
const openCreateConfigMountModal = () => {
  if (!createConfigMountModalRef.value) return
  createConfigMountModalRef.value.openModal()
}
</script>

<template>
  <!-- Modal to view config mount content -->
  <ModalDialog :close-modal="closeConfigModal" :is-open="isConfigViewModalOpen" width="xl">
    <template v-slot:header>Config Content</template>
    <template v-slot:body>
      <div class="mt-5">
        <p v-if="selectedConfigId === null" class="italic">No config selected</p>
        <Code v-else :show-copy-button="false">
          {{ applicationUpdater.configMountDetails.map[selectedConfigId].content }}
        </Code>
      </div>
    </template>
  </ModalDialog>
  <!-- Modal to edit config mount content -->
  <ModalDialog :close-modal="closeEditConfigModal" :is-open="isEditConfigModalOpen" width="xl">
    <template v-slot:header>Edit Config Content</template>
    <template v-slot:body>
      <div class="mt-5">
        <p v-if="selectedConfigId === null" class="italic">No config selected</p>
        <textarea
          rows="20"
          class="mt-2 w-full rounded-lg border-gray-300 align-top shadow-sm focus:border-primary-500 focus:ring-primary-500"
          :value="applicationUpdater.configMountDetails.map[selectedConfigId].content"
          @input="(e) => applicationUpdater.onConfigMountContentChange(selectedConfigId, e.target.value)"></textarea>
      </div>
    </template>
  </ModalDialog>
  <!--  Modal to create config mount  -->
  <CreateConfigMountModal ref="createConfigMountModalRef" :create-config-mount="applicationUpdater.addConfigMount" />
  <!--  Table to show config mounts  -->
  <Table>
    <template v-slot:header>
      <TableHeader align="left">Path</TableHeader>
      <TableHeader align="center">UID</TableHeader>
      <TableHeader align="center">GID</TableHeader>
      <TableHeader align="center">View Config</TableHeader>
      <TableHeader align="center">Edit Config</TableHeader>
      <TableHeader align="right">Delete</TableHeader>
    </template>
    <template v-slot:message>
      <TableMessage v-if="applicationUpdater.configMountDetails.keys.length === 0">
        No Config Mounts found.
      </TableMessage>
    </template>
    <template v-slot:body>
      <tr v-for="configMountKey in applicationUpdater.configMountDetails.keys" :key="configMountKey">
        <TableRow align="left">
          <div class="text-sm font-medium text-gray-900">
            {{ applicationUpdater.configMountDetails.map[configMountKey].mountingPath }}
          </div>
        </TableRow>
        <TableRow align="center">
          <div class="text-sm text-gray-900">{{ applicationUpdater.configMountDetails.map[configMountKey].uid }}</div>
        </TableRow>
        <TableRow align="center">
          <div class="text-sm text-gray-900">{{ applicationUpdater.configMountDetails.map[configMountKey].gid }}</div>
        </TableRow>
        <TableRow align="center" flex>
          <FilledButton type="primary" slim :click="() => openConfigModal(configMountKey)">View Config</FilledButton>
        </TableRow>
        <TableRow align="center" flex>
          <FilledButton type="primary" slim :click="() => openEditConfigModal(configMountKey)"
            >Edit Config
          </FilledButton>
        </TableRow>
        <TableRow align="right">
          <TextButton type="danger" @click="() => applicationUpdater.deleteConfigMount(configMountKey)"
            >Delete
          </TextButton>
        </TableRow>
      </tr>
    </template>
  </Table>
  <!-- More actions  -->
  <div class="mt-4 flex items-center justify-center gap-3">
    Need to add static config in your application ?
    <FilledButton slim type="primary" :click="openCreateConfigMountModal">Add config mount</FilledButton>
  </div>
</template>

<style scoped></style>
