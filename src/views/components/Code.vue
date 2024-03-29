<script setup>
import { useToast } from 'vue-toastification'
import { ref } from 'vue'

const toast = useToast()
const showCopyBorder = ref(false)
const textDivRef = ref(null)
const copyToClipboard = () => {
  toast.success('Copied to clipboard')
  if (textDivRef.value === null) {
    return
  }
  navigator.clipboard.writeText(textDivRef.value.innerText)
  showCopyBorder.value = true
  setTimeout(() => {
    showCopyBorder.value = false
  }, 2000)
}
</script>

<template>
  <div
    class="relative my-2 cursor-copy break-words rounded-lg border-2 border-secondary-300 bg-secondary-100 p-3 transition-all"
    :class="{
      'ring-2 ring-primary-300': showCopyBorder
    }">
    <div @click="copyToClipboard" ref="textDivRef">
      <slot></slot>
    </div>
    <div
      @click="copyToClipboard"
      class="absolute right-0 top-0 m-3 flex h-10 w-10 cursor-copy items-center justify-center rounded-lg border-2 border-primary-300 bg-white transition-all hover:bg-gray-200">
      <font-awesome-icon icon="fa-solid fa-clipboard" class="text-xl" />
    </div>
  </div>
</template>

<style scoped></style>
