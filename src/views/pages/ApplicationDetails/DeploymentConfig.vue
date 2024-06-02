<script setup>
import Switch from '@/views/components/Switch.vue'
import { useRouter } from 'vue-router'
import newApplicationUpdater from '@/store/applicationUpdater.js'

const router = useRouter()
const applicationUpdater = newApplicationUpdater(router.currentRoute.value.params.id)()
</script>

<template>
  <div class="flex flex-row items-center">
    <p>Deployment Strategy</p>
    <font-awesome-icon class="px-4" icon="fa-solid fa-arrow-right" />
    <p class="font-medium">Replicated</p>
    <Switch
      :enabled="applicationUpdater.deploymentConfigurationDetails.deploymentMode === 'global'"
      :onChange="applicationUpdater.changeDeploymentStrategy"
      class="mx-4" />
    <p class="font-medium">Global</p>
  </div>
  <!-- Replicas -->
  <div v-if="applicationUpdater.deploymentConfigurationDetails.deploymentMode === 'replicated'" class="mt-4 max-w-md">
    <label class="block text-sm font-medium text-gray-700" for="no_of_replicase"
      >No of Replicas <span class="text-red-600"> *</span>
    </label>
    <div class="mt-1">
      <input
        id="no_of_replicase"
        autocomplete="off"
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        name="no_of_replicase"
        placeholder="No of Replicas"
        type="text"
        @change="applicationUpdater.replicasCountChanged"
        v-model="applicationUpdater.deploymentConfigurationDetails.replicas" />
    </div>
  </div>
  <!-- Memory Config -->
  <div class="mt-5">
    <p>Memory Configuration</p>
    <div class="mt-1 flex w-full flex-row gap-5">
      <div>
        <label class="block text-sm font-medium text-gray-700" for="no_of_replicase"
          >Memory Limit (MB)<span class="text-red-600"> *</span>
        </label>
        <div class="mt-1">
          <input
            autocomplete="off"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            type="number"
            @change="(e) => applicationUpdater.onMemoryLimitChanged(parseInt(e.target.value) || 0)"
            v-model="applicationUpdater.deploymentConfigurationDetails.resourceLimit.memoryMb" />
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700" for="no_of_replicase"
          >Reserved Memory (MB)<span class="text-red-600"> *</span>
        </label>
        <div class="mt-1">
          <input
            autocomplete="off"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            type="number"
            @change="(e) => applicationUpdater.onMemoryReservedChanged(parseInt(e.target.value) || 0)"
            v-model="applicationUpdater.deploymentConfigurationDetails.reservedResource.memoryMb" />
        </div>
      </div>
    </div>
    <p class="mt-4 italic">
      <span class="text-red-600">* </span>If you want to set limit, set at-least <span class="font-medium">6MB</span> of
      memory.
    </p>
    <p class="mt-1 italic">
      <span class="text-red-600">* </span>If you want to provide <span class="font-medium">unlimited memory</span>, set
      the value to <span class="font-medium">0</span>
    </p>
  </div>
</template>

<style scoped></style>
