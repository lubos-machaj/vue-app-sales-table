<template>
  <table v-if="data.length && showTable">
    <thead>
      <tr>
        <th />
        <th
          v-for="store in stores"
          :key="store"
          @click="sortColumn(store)"
        >
          {{ store }}
        </th>
      </tr>
    </thead>
    <tbody>
      <template
        v-for="category in getCategories"
        :key="category"
      >
        <tr class="category">
          <td class="category-cell">
            {{ category }}
            <a
              class="category-toggle"
              @click.prevent="toggleProducts(category)"
              >{{ isCategoryVisible(category) ? '-' : '+' }}</a
            >
          </td>
          <td
            v-for="store in stores"
            :key="store"
          >
            {{ getPiecesByCategory(category, store) }}
          </td>
        </tr>
        <tr
          class="products"
          :class="{ hidden: !isCategoryVisible(category) }"
          v-for="product in getProducts(category)"
          :key="`${category}-${product}`"
        >
          <td>{{ product }}</td>
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
  import type { DataType, Order } from './types'
  import { OrderEnum } from './enums'

  // Data
  const data = ref<DataType[]>([])
  const filteredData = ref<DataType[]>([])

  // Collections
  const categories = ref<string[]>([])
  const stores = ref<string[]>([])

  // Sorting
  const sortedStore = ref('')
  const sortedStoreOrder = ref('')

  // Table visibility
  const showTable = ref(false)

  const visibleCategories = ref<string[]>([])

  /**
   * Group by product & store
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
    if (sortedStore.value) {
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

  const sortColumn = (store: string, order: Order = OrderEnum.ASC): void => {
    sortedStore.value = store
    sortedStoreOrder.value = order
    const sortedStoreData = data.value
      .filter((item) => item.store === store)
      .sort((a, b) => {
        if (order === OrderEnum.ASC) {
          return a.pcs - b.pcs
        } else {
          return b.pcs - a.pcs
        }
      })
    const otherData = data.value.filter((item) => item.store !== store)
    filteredData.value = [...sortedStoreData, ...otherData]
  }

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

<style scoped>
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }

  th,
  td {
    border: 1px solid #ddd;
    padding: 15px;
    text-align: left;
  }

  th {
    background-color: #2a2a2a;
    font-weight: bold;
    &:hover {
      background-color: #595959;
      cursor: pointer;
    }
  }

  .category {
    background-color: #3a3a3a;
    font-weight: bold;
    text-transform: uppercase;
  }
  .category-cell {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .category-toggle {
    width: 20px;
    height: 20px;
    text-align: center;
    color: #fff;
    text-decoration: none;
    padding: 5px;
    border-radius: 10%;
    border: 1px solid #8a8a8a;
    background-color: #595959;
    cursor: pointer;
    margin-left: 15px;
    &:hover {
      background-color: #696969;
    }
  }
  .hidden {
    display: none;
  }
</style>
