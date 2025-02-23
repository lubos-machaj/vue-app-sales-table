<template>
  <table v-if="filteredData.length">
    <thead>
      <tr>
        <th />
        <th v-for="store in stores" :key="store" @click="sortColumn(store)">{{ store }}</th>
      </tr>
    </thead>
    <tbody :key="componentKey">
      <template v-for="category in getCategories()" :key="category">
        <tr class="category">
          <td>{{ category }}</td>
          <td v-for="store in stores" :key="store">
            {{ getPiecesByCategory(category, store) }}
          </td>
        </tr>
        <tr v-for="product in getProducts(category)" :key="product">
          <td>{{ product }}</td>
          <td v-for="store in stores" :key="store">
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

import { ref, onMounted } from 'vue'

// Data
const groupedData: DataType = ref([])
const filteredData: DataType = ref([])

// Collections
const categories = ref([])
const stores = ref([])

// Sorting
const sortedStore = ref('')
const sortedStoreOrder = ref('')

// Key for re-rendering
const componentKey = ref([0])

const groupData = (data) => {
  // Group by product & store
  return Object.values(
    data.reduce((acc, curr) => {
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

const extractUniqueValues = (data, key) => {
  return [...new Set(data.map((item) => item[key]))]
}

const getPiecesByCategory = (category, store) => {
  return (
    filteredData.value.reduce((acc, curr) => {
      if (curr.category === category && curr.store === store) {
        acc += curr.pcs
      }
      return acc
    }, 0) || 0
  )
}

const getCategories = () => {
  if (sortedStore.value) {
    return Object.entries(
      filteredData.value
        .filter((item) => item.store === sortedStore.value)
        .reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + item.pcs
          return acc
        }, {}),
    )
      .sort((a, b) => {
        if (sortedStoreOrder.value === 'asc') {
          return a[1] - b[1]
        } else {
          return b[1] - a[1]
        }
      })
      .map((item) => item[0])
  } else {
    return categories.value
  }
}

const getProducts = (category) => {
  return extractUniqueValues(
    filteredData.value.filter((item) => item.category === category),
    'product',
  )
}

const getPiecesByProduct = (product, store) => {
  return (
    filteredData.value.find((item) => item.product === product && item.store === store)?.pcs || 0
  )
}

const sortColumn = (store, order = 'asc') => {
  sortedStore.value = store
  sortedStoreOrder.value = order
  const sortedStoreData = groupedData.value
    .filter((item) => item.store === store)
    .sort((a, b) => {
      if (order === 'asc') {
        return a.pcs - b.pcs
      } else {
        return b.pcs - a.pcs
      }
    })
  const otherData = groupedData.value.filter((item) => item.store !== store)
  filteredData.value = [...sortedStoreData, ...otherData]
  componentKey.value += 1
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
  padding: 8px;
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
