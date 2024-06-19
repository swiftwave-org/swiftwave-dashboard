<script setup>
import Switch from '@/views/components/Switch.vue'
import { useRouter } from 'vue-router'
import newApplicationUpdater from '@/store/applicationUpdater.js'
import Divider from '@/views/components/Divider.vue'
import DockerProxyPermissionChoose from '@/views/partials/DockerProxyPermissionChoose.vue'

const router = useRouter()
const applicationUpdater = newApplicationUpdater(router.currentRoute.value.params.id)()
</script>

<template>
  <div class="mt-3 flex flex-row items-center">
    <p class="font-medium text-black">Deployment Strategy</p>
    <font-awesome-icon class="px-4" icon="fa-solid fa-arrow-right" />
    <div class="flex flex-row items-center gap-2">
      <p class="font-medium">Replicated</p>
      <input
        v-if="applicationUpdater.deploymentConfigurationDetails.deploymentMode === 'replicated'"
        class="block h-8 w-16 rounded-full border-gray-300 shadow-sm [appearance:textfield] focus:border-primary-500 focus:ring-primary-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        name="no_of_replicase"
        placeholder="No of Replicas"
        type="number"
        @change="applicationUpdater.replicasCountChanged"
        v-model="applicationUpdater.deploymentConfigurationDetails.replicas" />
      <p v-if="applicationUpdater.deploymentConfigurationDetails.deploymentMode === 'replicated'">replica(s)</p>
    </div>
    <Switch
      :enabled="applicationUpdater.deploymentConfigurationDetails.deploymentMode === 'global'"
      :onChange="applicationUpdater.changeDeploymentStrategy"
      class="mx-4" />
    <p class="font-medium">Global</p>
  </div>
  <Divider />
  <!-- Memory Config -->
  <div>
    <p class="font-medium text-black">Memory Configuration</p>
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
  <Divider />
  <!-- Preferred Servers  -->
  <div>
    <p class="font-medium text-black">Deployment Preferred Servers</p>
    <div class="mt-1">
      <label class="block text-sm font-medium text-gray-700" for="no_of_replicase">Click below to select server </label>
      <input
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        placeholder="Click to add servers"
        type="text"
        v-model="applicationUpdater.preferredServerHostnames"
        disabled />
    </div>
  </div>
  <Divider />
  <!-- Docker Proxy Config -->
  <div>
    <p class="font-medium text-black">Docker Proxy Configuration</p>
    <p class="mt-2 italic">
      <span class="text-red-600">* </span>Don't enable it if your application doesn't need access to the Docker socket.
    </p>
    <p class="mt-1 italic">
      <span class="text-red-600">* </span>The security of the server may be compromised if this feature is not used
      properly.
    </p>
    <!-- Proxy Status   -->
    <div class="mt-4 flex flex-row gap-2">
      <p class="font-medium">Docker Proxy Status</p>
      <div class="multi-select">
        <div
          @click="applicationUpdater.enableDockerProxy"
          :class="{
            active: applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.enabled
          }">
          Enabled
        </div>
        <div
          @click="applicationUpdater.disableDockerProxy"
          :class="{
            active: !applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.enabled
          }">
          Disabled
        </div>
      </div>
    </div>
    <!--  Proxy Permission  -->
    <div
      class="mt-4 flex w-full flex-row gap-20 rounded-md border-2 border-secondary-300 p-2"
      v-if="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.enabled">
      <div class="flex w-1/3 flex-col gap-2">
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Ping</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.ping"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.ping = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Version</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.version"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.version = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Info</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.info"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.info = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Events</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.events"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.events = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Auth</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.auth"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.auth = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Secrets</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.secrets"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.secrets = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Build</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.build"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.build = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Commit</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.commit"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.commit = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
      </div>
      <div class="flex w-1/3 flex-col gap-2">
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Configs</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.configs"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.configs = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Containers</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.containers"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.containers = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Distribution</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.distribution"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.distribution = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Exec</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.exec"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.exec = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Grpc</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.grpc"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.grpc = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Images</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.images"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.images = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Networks</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.networks"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.networks = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Nodes</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.nodes"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.nodes = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
      </div>
      <div class="flex w-1/3 flex-col gap-2">
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Plugins</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.plugins"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.plugins = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Services</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.services"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.services = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Session</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.session"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.session = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Swarm</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.swarm"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.swarm = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">System</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.system"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.system = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Tasks</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.tasks"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.tasks = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
        <div class="flex flex-row justify-between gap-2">
          <p class="w-1/3 font-normal text-gray-800">Volumes</p>
          <DockerProxyPermissionChoose
            :value="applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.volumes"
            :on-change="
              (value) =>
                (applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.permission.volumes = value) &&
                applicationUpdater.triggerUpdateHook()
            " />
        </div>
      </div>
    </div>
    <!--  How to use  -->
    <div
      class="mt-4"
      v-if="
        applicationUpdater.deploymentConfigurationDetails.dockerProxyConfig.enabled &&
        applicationUpdater.dockerProxyHost
      ">
      <p class="font-medium">Usage Guide</p>
      <p class="mt-2">
        1. Use <span class="font-semibold" v-html="`{{DOCKER_PROXY_HOST}}`"></span> as value of environment variable.
        While deploying app, swiftwave will inject the docker proxy host.
      </p>
      <p class="mt-2" v-if="applicationUpdater.dockerProxyHost">
        2. Use this hostname for configuring remote docker host in your application >
        <span class="font-semibold" v-html="applicationUpdater.dockerProxyHost"></span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.multi-select {
  @apply flex h-fit w-min overflow-hidden rounded-md border border-secondary-400;

  div {
    @apply cursor-pointer border-r border-secondary-400 bg-secondary-100 px-2.5 py-0.5 text-sm transition-all;
  }

  div:last-child {
    @apply border-0;
  }

  .active {
    @apply bg-primary-600  text-white;
  }
}
</style>
