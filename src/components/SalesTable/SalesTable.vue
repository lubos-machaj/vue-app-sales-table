<template>
  <table v-if="filteredData.length">
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
          <td>{{ category }}</td>
          <td
            v-for="store in stores"
            :key="store"
          >
            {{ getPiecesByCategory(category, store) }}
          </td>
        </tr>
        <tr
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
</template>

<script setup lang="ts">
  type DataType = {
    product: string
    pcs: number
    category: string
    store: string
  }

  type Order = 'asc' | 'desc'

  enum OrderEnum {
    ASC = 'asc',
    DESC = 'desc',
  }

  import { ref, onMounted, computed } from 'vue'

  // Data
  const groupedData = ref<DataType[]>([])
  const filteredData = ref<DataType[]>([])

  // Collections
  const categories = ref<string[]>([])
  const stores = ref<string[]>([])

  // Sorting
  const sortedStore = ref('')
  const sortedStoreOrder = ref('')

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

  const extractUniqueValues = (data: DataType[], key: keyof DataType): string[] => {
    return [...new Set(data.map((item) => item[key]))] as string[]
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
    const sortedStoreData = groupedData.value
      .filter((item) => item.store === store)
      .sort((a, b) => {
        if (order === OrderEnum.ASC) {
          return a.pcs - b.pcs
        } else {
          return b.pcs - a.pcs
        }
      })
    const otherData = groupedData.value.filter((item) => item.store !== store)
    filteredData.value = [...sortedStoreData, ...otherData]
  }

  onMounted(() => {
    fetch('./data/fe-data.json')
      .then((response) => response.json())
      .then((data) => {
        groupedData.value = groupData(data)
        filteredData.value = groupedData.value
        categories.value = extractUniqueValues(data, 'category')
        stores.value = extractUniqueValues(data, 'store')
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
</style>
