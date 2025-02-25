<template>
  <table v-if="data.length && showTable">
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
    v-else
    v-text="'Something went wrong with the data. Please try again.'"
  />
</template>

<script setup lang="ts">
  import axios from 'axios'
  import { ref, onMounted, computed } from 'vue'
  import type { DataType } from './types'
  import { OrderEnum } from './enums'

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

  const extractUniqueValues = (
    data: DataType[],
    key: keyof DataType,
    sorting = false,
  ): string[] => {
    const setCollection = [...new Set(data.map((item) => item[key]))] as string[]
    if (sorting) setCollection.sort()
    return setCollection
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
    if (sortedStore.value && sortedStoreOrder.value) {
      return Object.entries(
        filteredData.value
          .filter((item) => item.store === sortedStore.value)
          .reduce((acc: { [key: string]: number }, item) => {
            acc[item.category] = (acc[item.category] || 0) + item.pcs
            return acc
          }, {}),
      )
        .sort((a, b) => {
          if (sortedStoreOrder.value === OrderEnum.ASC) {
            return a[1] - b[1]
          } else {
            return b[1] - a[1]
          }
        })
        .map((item) => item[0])
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
          if (sortedStoreOrder.value === OrderEnum.ASC) {
            return a.pcs - b.pcs
          } else {
            return b.pcs - a.pcs
          }
        })
      const otherData = data.value.filter((item) => item.store !== store)
      filteredData.value = [...sortedStoreData, ...otherData]
    } else {
      // original order
      filteredData.value = data.value
    }
  }

  // const getIcon = (store: string): string => {
  //   return sortedStore.value === store && sortedStoreOrder.value
  //     ? sortedStoreOrder.value === OrderEnum.ASC
  //       ? '↓'
  //       : '↑'
  //     : '↔'
  // }

  const toggleProducts = (category: string): void => {
    visibleCategories.value = visibleCategories.value.find((item) => item === category)
      ? visibleCategories.value.filter((item) => item !== category)
      : [...visibleCategories.value, category]
  }

  const isCategoryVisible = (category: string): boolean => {
    return visibleCategories.value.includes(category)
  }

  onMounted(() => {
    axios
      .get('./data/fe-data.json')
      .then((response) => {
        data.value = groupData(response.data)
        filteredData.value = data.value
        categories.value = extractUniqueValues(data.value, 'category', true)
        stores.value = extractUniqueValues(data.value, 'store', true)
        showTable.value = true
      })
      .catch((error) => {
        console.error('Error:', error)
      })
  })
</script>

<style scoped></style>
