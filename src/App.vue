<script setup>
import { RouterView, useRouter } from 'vue-router'
import { computed, onBeforeMount, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth.js'
import SideBar from '@/views/partials/SideBar.vue'
import LoadingPage from '@/views/pages/LoadingPage.vue'
import NotAvailableOnMobile from '@/views/pages/NotAvailableOnMobile.vue'
import GlobalWarning from '@/views/partials/GlobalWarning.vue'

const authStore = useAuthStore()
const router = useRouter()

onBeforeMount(() => {
  const token = localStorage.getItem('token')
  if (token !== null) {
    authStore.SetCredential(token)
  }
})

onMounted(() => {
  authStore.StartAuthChecker(() => {
    authStore.Logout()
  })
})

const isLoginPage = computed(() => router.currentRoute.value.name === 'Login')
</script>

<template>
  <LoadingPage :show="authStore.IsLoggingInProgress" />
  <div class="app">
    <SideBar class="w-80" />
    <div
      class="scrollbox flex max-h-[100vh] w-full flex-col items-center overflow-y-auto"
      :class="{
        'p-4': !isLoginPage
      }">
      <RouterView />
    </div>
    <GlobalWarning />
  </div>
  <NotAvailableOnMobile />
</template>

<style>
.app {
  display: flex;
  flex-direction: row;
  height: 100vh;
  width: 100vw;
}

.scrollbox::-webkit-scrollbar {
  width: 9px;
  height: 9px;
}

.scrollbox::-webkit-scrollbar-track {
  @apply rounded-full bg-gray-200;
}

.scrollbox::-webkit-scrollbar-thumb {
  @apply rounded-full bg-primary-500;
}

.terminal {
  margin-right: calc(0.5rem + 9px);
}

.xterm-viewport {
  right: calc(-0.5rem - 9px) !important;
  cursor: pointer !important;
  overflow-y: auto !important;
}

.xterm-viewport::-webkit-scrollbar {
  width: 9px !important;
  height: 9px !important;
}

.xterm-viewport::-webkit-scrollbar-track {
  @apply rounded-full bg-gray-200;
}

.xterm-viewport::-webkit-scrollbar-thumb {
  @apply rounded-full bg-primary-500;
}

.bg-color-1 {
  @apply bg-amber-300 !important;
}

.border-color-1 {
  @apply border-amber-400 !important;
}

.bg-color-2 {
  @apply bg-green-300 !important;
}

.border-color-2 {
  @apply border-green-400 !important;
}

.bg-color-3 {
  @apply bg-blue-300 !important;
}

.border-color-3 {
  @apply border-blue-400 !important;
}

.bg-color-4 {
  @apply bg-gray-300 !important;
}

.border-color-4 {
  @apply border-gray-400 !important;
}
</style>
