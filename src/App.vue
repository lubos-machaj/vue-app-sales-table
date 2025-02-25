<template>
  <TheLoader v-if="loader" />
  <main>
    <SalesTable @loader="loader = $event" />
  </main>
</template>

<script setup lang="ts">
  import SalesTable from '@/components/SalesTable/SalesTable.vue'
  import TheLoader from '@/components/common/TheLoader.vue'
  import { ref } from 'vue'
  const loader = ref(true)
</script>
