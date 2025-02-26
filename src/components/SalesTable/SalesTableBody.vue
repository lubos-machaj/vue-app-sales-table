<template>
  <tbody>
    <template
      v-for="category in getCategories"
      :key="category"
    >
      <SalesTableBodyCategoryRow
        :category="category"
        :stores="props.stores"
        :filtered-data="props.filteredData"
        :visibleCategories="visibleCategories"
        @toggleProducts="toggleProducts($event)"
      />

      <SalesTableBodyProductRow
        v-for="product in getProducts(category)"
        :product="product"
        :stores="props.stores"
        :key="`${category}-${product}`"
        :filtered-data="props.filteredData"
        :class="{ hidden: !isCategoryVisible(category) }"
        class="product-row"
      />
    </template>
  </tbody>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import type { DataType } from '@/types'
  import { OrderEnum } from '@/enums'
  import { extractUniqueValues } from '@/utils'
  import SalesTableBodyCategoryRow from './SalesTableBodyCategoryRow.vue'
  import SalesTableBodyProductRow from './SalesTableBodyProductRow.vue'

  const visibleCategories = ref<string[]>([])

  const props = defineProps<{
    stores: string[]
    categories: string[]
    sortedStore: string
    sortedStoreOrder: string | null
    filteredData: DataType[]
  }>()

  const getCategories = computed((): string[] => {
    // sorting by store & pieces
    if (props.sortedStore && props.sortedStoreOrder) {
      const categoryPieces = props.filteredData
        .filter((item) => item.store === props.sortedStore)
        .reduce((acc: Record<string, number>, item) => {
          acc[item.category] = (acc[item.category] || 0) + item.pcs
          return acc
        }, {})

      return Object.entries(categoryPieces)
        .sort(([, a], [, b]) => (props.sortedStoreOrder === OrderEnum.ASC ? a - b : b - a))
        .map(([category]) => category)
    } else {
      return props.categories
    }
  })

  const getProducts = (category: string): string[] => {
    return extractUniqueValues(
      props.filteredData.filter((item) => item.category === category),
      'product',
      !props.sortedStoreOrder,
    )
  }

  const toggleProducts = (category: string): void => {
    visibleCategories.value = visibleCategories.value.find((item) => item === category)
      ? visibleCategories.value.filter((item) => item !== category)
      : [...visibleCategories.value, category]
  }

  const isCategoryVisible = (category: string): boolean => {
    return visibleCategories.value.includes(category)
  }
</script>
