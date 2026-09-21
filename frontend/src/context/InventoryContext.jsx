import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { inventoryApi } from '../api/inventoryApi.js'

const InventoryContext = createContext(null)

async function loadInventory() {
  const [tenantResponse, productResponse, reservationResponse] = await Promise.all([
    inventoryApi.listTenants(),
    inventoryApi.listProducts(),
    inventoryApi.listReservations(),
  ])

  return {
    tenants: tenantResponse.data,
    products: productResponse.data,
    reservations: reservationResponse.data,
  }
}

export function InventoryProvider({ children }) {
  const [data, setData] = useState({ tenants: [], products: [], reservations: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await loadInventory())
    } catch (requestError) {
      setError(requestError.message || 'Unable to load inventory data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    loadInventory()
      .then((snapshot) => {
        if (!cancelled) setData(snapshot)
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message || 'Unable to load inventory data.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const mutate = useCallback(
    async (operation) => {
      await operation()
      await refresh()
    },
    [refresh],
  )

  const actions = useMemo(
    () => ({
      createTenant: (values) => mutate(() => inventoryApi.createTenant(values)),
      updateTenant: (id, values) => mutate(() => inventoryApi.updateTenant(id, values)),
      deleteTenant: (id) => mutate(() => inventoryApi.deleteTenant(id)),
      createProduct: (values) => mutate(() => inventoryApi.createProduct(values)),
      updateProduct: (id, values) => mutate(() => inventoryApi.updateProduct(id, values)),
      deleteProduct: (id) => mutate(() => inventoryApi.deleteProduct(id)),
      createReservation: (values) => mutate(() => inventoryApi.createReservation(values)),
      updateReservation: (id, values) =>
        mutate(() => inventoryApi.updateReservation(id, values)),
      deleteReservation: (id) => mutate(() => inventoryApi.deleteReservation(id)),
    }),
    [mutate],
  )

  const value = useMemo(
    () => ({ ...data, loading, error, refresh, ...actions }),
    [actions, data, error, loading, refresh],
  )

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useInventory() {
  const context = useContext(InventoryContext)
  if (!context) {
    throw new Error('useInventory must be used inside InventoryProvider')
  }
  return context
}
