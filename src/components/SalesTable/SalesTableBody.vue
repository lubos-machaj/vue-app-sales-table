<template>
  <tbody>
    <template
      v-for="category in getCategories"
      :key="category"
    >
      <tr class="category-row">
        <td class="category-group">
          {{ category }}
          <a
            class="category-toggle"
            :class="{ open: isCategoryVisible(category) }"
            @click.prevent="toggleProducts(category)"
          />
        </td>
        <td
          v-for="store in props.stores"
          :key="store"
        >
          {{ getPiecesByCategory(category, store) }}
        </td>
      </tr>
      <tr
        class="product-row"
        :class="{ hidden: !isCategoryVisible(category) }"
        v-for="product in getProducts(category)"
        :key="`${category}-${product}`"
      >
        <td
          class="product-item"
          v-text="product"
        />
        <td
          v-for="store in props.stores"
          :key="store"
        >
          {{ getPiecesByProduct(product, store) }}
        </td>
      </tr>
    </template>
  </tbody>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import type { DataType } from '@/types'
  import { OrderEnum } from '@/enums'
  import { extractUniqueValues } from '@/utils'

  const visibleCategories = ref<string[]>([])

  const props = defineProps<{
    stores: string[]
    categories: string[]
    sortedStore: string
    sortedStoreOrder: string
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

  const getPiecesByProduct = (product: string, store: string): number => {
    return (
      props.filteredData.find((item) => item.product === product && item.store === store)?.pcs || 0
    )
  }

  const getProducts = (category: string): string[] => {
    return extractUniqueValues(
      props.filteredData.filter((item) => item.category === category),
      'product',
    )
  }

  const isCategoryVisible = (category: string): boolean => {
    return visibleCategories.value.includes(category)
  }

  const toggleProducts = (category: string): void => {
    visibleCategories.value = visibleCategories.value.find((item) => item === category)
      ? visibleCategories.value.filter((item) => item !== category)
      : [...visibleCategories.value, category]
  }
</script>

<style scoped></style>
