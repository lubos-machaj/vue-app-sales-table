<template>
  <p
    class="error-message"
    v-text="text"
  />
</template>

<script setup lang="ts">
  defineProps<{
    text: string
  }>()
</script>

<style scoped>
  .error-message {
    text-align: center;
  }
</style>
