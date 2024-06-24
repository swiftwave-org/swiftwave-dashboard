<template>
  <div class="status-badge flex gap-3 items-center">
    <div class="indicator" :class="`bg-${props.type}-500 h-${props.size} w-${props.size}`"></div>
    <p class="text capitalize">
      <slot />
    </p>
  </div>
</template>

<script setup>
const props = defineProps({
  type: {
    type: String,
    default: 'success'
  },
  size: {
    type: String,
    default: '3'
  }
})

</script>

<style scoped>
.status-badge {
  padding: 0;
}

.status-badge .indicator {
  /* height: 10px;
  width: 10px; */

  border-radius: 50%;
}
</style>