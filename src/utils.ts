import type { DataType } from './types'

/**
 * Extract unique values from an array of objects.
 * @param data - array of objects
 * @param key - key to extract unique values from
 * @param sorting - sort the collection of unique values (default: false)
 * @returns - collection of unique values
 */
export const extractUniqueValues = (
  data: DataType[],
  key: keyof DataType,
  sorting = false,
): string[] => {
  const setCollection = [...new Set(data.map((item) => item[key]))] as string[]
  return sorting ? setCollection.sort() : setCollection
}
