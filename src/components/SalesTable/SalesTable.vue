<template>
  <table v-if="filteredData.length && showTable">
    <thead>
      <tr>
        <th />
        <th
          v-for="store in stores"
          :key="store"
          class="store-column"
          @click="sortColumn(store)"
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
            v-for="store in stores"
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
            v-for="store in stores"
            :key="store"
          >
            {{ getPiecesByProduct(product, store) }}
          </td>
        </tr>
      </template>
    </tbody>
  </table>
  <p
    v-if="!filteredData.length"
    class="error-message"
    v-text="'Something went wrong with the data. Please try again.'"
  />
</template>

<script setup lang="ts">
  import { ref, onBeforeMount, computed, defineEmits } from 'vue'
  import axios from 'axios'
  import type { DataType } from '@/types'
  import { OrderEnum } from '@/enums'
  import { extractUniqueValues } from '@/utils'

  // Data
  const data = ref<DataType[]>([])
  const filteredData = ref<DataType[]>([])

  // Collections
  const categories = ref<string[]>([])
  const stores = ref<string[]>([])

  // Sorting
  const sortedStore = ref('')
  const sortedStoreOrder = ref<string | null>('')

  // Visibility
  const showTable = ref(false)
  const visibleCategories = ref<string[]>([])

  // Emit
  const emit = defineEmits(['loader'])

  /**
   * Group data by product & store
   */
  const groupData = (data: DataType[]): DataType[] => {
    return Object.values(
      data.reduce((acc: { [key: string]: DataType }, curr) => {
        // Unique key for grouping
        const key = `${curr.store}-${curr.product}`
        if (!acc[key]) {
          // Initialize entry
          acc[key] = { ...curr }
        } else {
          // Sum up pcs
          acc[key].pcs += curr.pcs
        }
        return acc
      }, {}),
    )
  }

  const getPiecesByCategory = (category: string, store: string): number => {
    return (
      filteredData.value.reduce((acc, curr) => {
        if (curr.category === category && curr.store === store) {
          acc += curr.pcs
        }
        return acc
      }, 0) || 0
    )
  }

  const getPiecesByProduct = (product: string, store: string): number => {
    return (
      filteredData.value.find((item) => item.product === product && item.store === store)?.pcs || 0
    )
  }

  const getCategories = computed((): string[] => {
    // sorting by store & pieces
    if (sortedStore.value && sortedStoreOrder.value) {
      const categoryPieces = filteredData.value
        .filter((item) => item.store === sortedStore.value)
        .reduce((acc: Record<string, number>, item) => {
          acc[item.category] = (acc[item.category] || 0) + item.pcs
          return acc
        }, {})

      return Object.entries(categoryPieces)
        .sort(([, a], [, b]) => (sortedStoreOrder.value === OrderEnum.ASC ? a - b : b - a))
        .map(([category]) => category)
    } else {
      return categories.value
    }
  })

  const getProducts = (category: string): string[] => {
    return extractUniqueValues(
      filteredData.value.filter((item) => item.category === category),
      'product',
    )
  }

  /**
   * Sort by store & pieces
   */
  const sortColumn = (store: string): void => {
    // reset sorting
    if (sortedStore.value !== store) sortedStoreOrder.value = null

    // set store
    sortedStore.value = store

    // set next sorting order
    sortedStoreOrder.value =
      sortedStoreOrder.value === OrderEnum.ASC
        ? OrderEnum.DESC
        : sortedStoreOrder.value === OrderEnum.DESC
          ? null
          : OrderEnum.ASC

    // if not null, sort by order
    if (sortedStoreOrder.value) {
      const sortedStoreData = data.value
        .filter((item) => item.store === store)
        .sort((a, b) => {
          return sortedStoreOrder.value === OrderEnum.ASC ? a.pcs - b.pcs : b.pcs - a.pcs
        })
      const otherData = data.value.filter((item) => item.store !== store)
      filteredData.value = [...sortedStoreData, ...otherData]
    } else {
      // original order
      filteredData.value = data.value
    }
  }

  const toggleProducts = (category: string): void => {
    visibleCategories.value = visibleCategories.value.find((item) => item === category)
      ? visibleCategories.value.filter((item) => item !== category)
      : [...visibleCategories.value, category]
  }

  const isCategoryVisible = (category: string): boolean => {
    return visibleCategories.value.includes(category)
  }

  // @TODO - fetch data from API
  const fetchData = async () => {
    try {
      const response = await axios.get('./data/fe-data.json')
      data.value = groupData(response.data)
      filteredData.value = data.value
      categories.value = extractUniqueValues(data.value, 'category', true)
      stores.value = extractUniqueValues(data.value, 'store', true)
      showTable.value = true
      emit('loader', false)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  onBeforeMount(fetchData)
</script>
