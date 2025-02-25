<template>
  <tr class="category-row">
    <td class="category-group">
      {{ category }}
      <a
        class="category-toggle"
        :class="{ open: isCategoryVisible(category) }"
        @click.prevent="emit('toggleProducts', category)"
      />
    </td>
    <td
      v-for="store in stores"
      :key="store"
    >
      {{ getPiecesByCategory(category, store) }}
    </td>
  </tr>
</template>

<script setup lang="ts">
  import type { DataType } from '@/types'

  const props = defineProps<{
    category: string
    stores: string[]
    filteredData: DataType[]
    visibleCategories: string[]
  }>()

  const emit = defineEmits(['toggleProducts'])

  const getPiecesByCategory = (category: string, store: string): number => {
    return (
      props.filteredData.reduce((acc, curr) => {
        if (curr.category === category && curr.store === store) {
          acc += curr.pcs
        }
        return acc
      }, 0) || 0
    )
  }

  const isCategoryVisible = (category: string): boolean => {
    return props.visibleCategories.includes(category)
  }
</script>

<style scoped></style>
