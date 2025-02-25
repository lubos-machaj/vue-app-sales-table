<template>
  <thead>
    <tr>
      <th />
      <th
        v-for="store in stores"
        :key="store"
        class="store-column"
        @click="emit('sortColumn', store)"
      >
        <p class="store-name">
          {{ store }}
          <span
            class="store-sorting-icon"
            :class="sortedStore === store && sortedStoreOrder"
          />
        </p>
      </th>
    </tr>
  </thead>
</template>

<script setup lang="ts">
  defineProps<{
    stores: string[]
    sortedStore: string
    sortedStoreOrder: string | null
  }>()

  const emit = defineEmits(['sortColumn'])
</script>

<style scoped></style>
