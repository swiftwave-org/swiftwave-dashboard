<script setup>
defineProps({
  type: {
    type: String,
    default: 'success',
    validator: (value) => {
      return ['primary', 'secondary', 'success', 'danger', 'warning'].includes(value)
    }
  }
})
</script>
<template>
  <div class="flex items-center gap-3 p-0">
    <div
      class="h-3 w-3 rounded-full"
      :class="{
        'bg-primary-500': type === 'primary',
        'bg-secondary-500': type === 'secondary',
        'bg-success-500': type === 'success',
        'bg-danger-500': type === 'danger',
        'bg-warning-500': type === 'warning'
      }"></div>
    <slot />
  </div>
</template>

<style scoped></style>
