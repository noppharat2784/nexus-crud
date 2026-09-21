import { inventoryApi as liveInventoryApi } from './inventoryApi.js'
import { inventoryApi as mockInventoryApi } from './mockApi.js'

const dataSource = import.meta.env.VITE_DATA_SOURCE || 'mock'

if (!['mock', 'api'].includes(dataSource)) {
  throw new Error(
    `Unsupported VITE_DATA_SOURCE "${dataSource}". Use "mock" or "api".`,
  )
}

export const inventoryApi =
  dataSource === 'api' ? liveInventoryApi : mockInventoryApi

export const inventoryDataSource = dataSource
