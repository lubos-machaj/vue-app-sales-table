<template>
  <tr>
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

<script setup lang="ts">
  import type { DataType } from '@/types'

  const props = defineProps<{
    product: string
    stores: string[]
    filteredData: DataType[]
  }>()

  const getPiecesByProduct = (product: string, store: string): number => {
    return (
      props.filteredData.find((item) => item.product === product && item.store === store)?.pcs || 0
    )
  }
</script>

<style scoped></style>
