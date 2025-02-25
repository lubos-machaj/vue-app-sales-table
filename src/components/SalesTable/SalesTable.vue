<template>
  <table v-if="filteredData.length && showTable">
    <SalesTableHeader
      :stores="stores"
      :sortedStore="sortedStore"
      :sortedStoreOrder="sortedStoreOrder"
      @sortColumn="sortColumn($event)"
    />
    <SalesTableBody
      :stores="stores"
      :categories="categories"
      :sortedStore="sortedStore"
      :filteredData="filteredData"
      :sortedStoreOrder="sortedStoreOrder"
    />
  </table>
  <p
    v-if="!filteredData.length"
    class="error-message"
    v-text="'Something went wrong with the data. Please try again.'"
  />
</template>

<script setup lang="ts">
  import { ref, onBeforeMount } from 'vue'
  import axios from 'axios'
  import type { DataType } from '@/types'
  import { OrderEnum } from '@/enums'
  import { extractUniqueValues } from '@/utils'
  import SalesTableHeader from './SalesTableHeader.vue'
  import SalesTableBody from './SalesTableBody.vue'

  // Data
  const data = ref<DataType[]>([])
  const filteredData = ref<DataType[]>([])

  // Collections
  const categories = ref<string[]>([])
  const stores = ref<string[]>([])

  // Sorting
  const sortedStore = ref('')
  const sortedStoreOrder = ref<string | null>(null)

  // Visibility
  const showTable = ref(false)

  // Emit
  const emit = defineEmits(['loader'])

  const fetchData = async () => {
    try {
      const response = await axios.get('https://hiring.wdev.sk/fe-data')
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

  onBeforeMount(fetchData)
</script>
