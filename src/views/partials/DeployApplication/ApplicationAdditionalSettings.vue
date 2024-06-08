<script setup>
import { TabPanel } from '@headlessui/vue'
import Switch from '@/views/components/Switch.vue'
import { reactive } from 'vue'
import EnvironmentVariablesEditor from '@/views/partials/DeployApplication/EnvironmentVariablesEditor.vue'
import { v4 as uuidv4 } from 'uuid'
import PersistentVolumeBindingEditor from '@/views/partials/DeployApplication/PersistentVolumeBindingEditor.vue'
import FilledButton from '@/views/components/FilledButton.vue'
import Disclosure from '@/views/components/Disclosure.vue'
import ConfigMountsEditor from '@/views/partials/DeployApplication/ConfigMountsEditor.vue'

const props = defineProps({
  finalizeApplicationAdditionalSettingsAndDeploy: {
    type: Function,
    required: true
  },
  isDeployRequestSubmitting: {
    required: true
  }
})

const stateRef = reactive({
  replicas: 1,
  deploymentStrategy: 'replicated',
  // replicate -> false, global -> true,
  environmentVariablesKeys: [],
  environmentVariablesMap: {},
  persistentVolumeBindingKeys: [],
  persistentVolumeBindingsMap: {},
  configMountKeys: [],
  configMountsMap: {}
})

// Environment Variables Functions
const addEnvironmentVariable = () => {
  const key = uuidv4()
  stateRef.environmentVariablesKeys.push(key)
  stateRef.environmentVariablesMap[key] = {
    name: '',
    value: ''
  }
}

const deleteEnvironmentVariable = (key) => {
  let keys
  keys = stateRef.environmentVariablesKeys.filter((k) => k !== key)
  stateRef.environmentVariablesKeys = keys
  delete stateRef.environmentVariablesMap[key]
}

const changeDeploymentStrategy = (switchStatus) => {
  if (switchStatus) {
    stateRef.deploymentStrategy = 'global'
    stateRef.replicas = 0
  } else {
    stateRef.deploymentStrategy = 'replicated'
    stateRef.replicas = 1
  }
}

const onVariableNameChange = (key, value) => {
  stateRef.environmentVariablesMap[key].name = value
}

const onVariableValueChange = (key, value) => {
  stateRef.environmentVariablesMap[key].value = value
}

// Persistent Volume Binding Functions
const addPersistentVolumeBinding = () => {
  const key = uuidv4()
  stateRef.persistentVolumeBindingKeys.push(key)
  stateRef.persistentVolumeBindingsMap[key] = {
    persistentVolumeID: -1,
    mountingPath: ''
  }
}

const deletePersistentVolumeBinding = (key) => {
  let keys
  keys = stateRef.persistentVolumeBindingKeys.filter((k) => k !== key)
  stateRef.persistentVolumeBindingKeys = keys
  delete stateRef.persistentVolumeBindingsMap[key]
}

const onPersistentVolumeChange = (key, value) => {
  stateRef.persistentVolumeBindingsMap[key].persistentVolumeID = value
}

const onMountingPathChange = (key, value) => {
  stateRef.persistentVolumeBindingsMap[key].mountingPath = value
}

// Config Mount Functions
const addConfigMount = (details) => {
  const mountingPath = details.mountingPath
  // check if mounting path is already used
  for (const key in stateRef.configMountKeys) {
    if (stateRef.configMountsMap[key].mountingPath === mountingPath) {
      throw new Error('Mounting path already used')
    }
  }
  const key = uuidv4()
  stateRef.configMountKeys.push(key)
  stateRef.configMountsMap[key] = details
}

const deleteConfigMount = (key) => {
  let keys
  keys = stateRef.configMountKeys.filter((k) => k !== key)
  stateRef.configMountKeys = keys
  delete stateRef.configMountsMap[key]
}

const onConfigMountContentChange = (key, value) => {
  stateRef.configMountsMap[key].content = value
}

const submitDetails = () => {
  let environmentVariables = []
  for (let key in stateRef.environmentVariablesMap) {
    environmentVariables.push({
      key: stateRef.environmentVariablesMap[key].name,
      value: stateRef.environmentVariablesMap[key].value
    })
  }
  let details = {
    deploymentMode: stateRef.deploymentStrategy,
    replicas: stateRef.replicas,
    environmentVariables: environmentVariables,
    persistentVolumeBindings: Object.values(stateRef.persistentVolumeBindingsMap),
    configMounts: Object.values(stateRef.configMountsMap)
  }
  props.finalizeApplicationAdditionalSettingsAndDeploy(details)
}
</script>

<template>
  <TabPanel :key="3" class="flex w-full flex-col p-6">
    <!-- Environment Variables -->
    <p class="mt-6 text-base font-medium text-gray-900">Environment Variables</p>
    <EnvironmentVariablesEditor
      :add-environment-variable="addEnvironmentVariable"
      :delete-environment-variable="deleteEnvironmentVariable"
      :environment-variables-keys="stateRef.environmentVariablesKeys"
      :environment-variables-map="stateRef.environmentVariablesMap"
      :on-variable-name-change="onVariableNameChange"
      :on-variable-value-change="onVariableValueChange"
      class="mt-2" />
    <!-- Persistent Volumes -->
    <p class="mb-2 mt-6 text-base font-medium text-gray-900">Persistent Volumes</p>
    <PersistentVolumeBindingEditor
      :add-persistent-volume-binding="addPersistentVolumeBinding"
      :delete-persistent-volume-binding="deletePersistentVolumeBinding"
      :on-mounting-path-change="onMountingPathChange"
      :on-persistent-volume-change="onPersistentVolumeChange"
      :persistent-volume-binding-keys="stateRef.persistentVolumeBindingKeys"
      :persistent-volume-bindings-map="stateRef.persistentVolumeBindingsMap"
      class="mt-2" />
    <!-- Advanced Settings -->
    <Disclosure class="my-6">
      <template v-slot:title>Advanced Settings (Click to expand)</template>
      <template v-slot:body>
        <!-- Deployment Configuration -->
        <div class="mt-3 flex flex-row items-center">
          <p class="font-medium text-black">Deployment Strategy</p>
          <font-awesome-icon class="px-4" icon="fa-solid fa-arrow-right" />
          <div class="flex flex-row items-center gap-2">
            <p class="font-medium">Replicated</p>
            <input
              v-if="stateRef.deploymentStrategy === 'replicated'"
              class="block h-8 w-16 rounded-full border-gray-300 shadow-sm [appearance:textfield] focus:border-primary-500 focus:ring-primary-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              name="no_of_replicase"
              placeholder="No of Replicas"
              type="number"
              v-model="stateRef.replicas" />
            <p v-if="stateRef.deploymentStrategy === 'replicated'">replica(s)</p>
          </div>
          <Switch
            :enabled="stateRef.deploymentStrategy === 'global'"
            :onChange="changeDeploymentStrategy"
            class="mx-4" />
          <p class="font-medium">Global</p>
        </div>
        <!--    Config mounts    -->
        <div class="mt-2 w-full">
          <p class="mb-2 text-base font-medium">Config Mounts</p>
          <ConfigMountsEditor
            :config-mounts-keys="stateRef.configMountKeys"
            :config-mounts-map="stateRef.configMountsMap"
            :add-config-mount="addConfigMount"
            :delete-config-mount="deleteConfigMount"
            :on-config-content-change="onConfigMountContentChange" />
        </div>
      </template>
    </Disclosure>
    <!-- Proceed to next -->
    <div class="mt-6 flex flex-row justify-end">
      <FilledButton type="primary" @click="submitDetails" :loading="isDeployRequestSubmitting">
        <font-awesome-icon icon="fa-solid fa-hammer" class="mr-2" />
        Confirm & Deploy Application
      </FilledButton>
    </div>
  </TabPanel>
</template>

<style scoped></style>
