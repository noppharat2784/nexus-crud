export const RESERVATION_STATUSES = ['RESERVED', 'COMMITTED', 'RELEASED']

const toQuantity = (value) => {
  const quantity = Number(value)
  return Number.isFinite(quantity) ? quantity : 0
}

export function buildStockAnalytics(tenants, products) {
  const stockByTenant = new Map(
    tenants.map((tenant) => [
      tenant.tenant_id,
      {
        tenant_id: tenant.tenant_id,
        tenant_name: tenant.tenant_name,
        stock: 0,
      },
    ]),
  )

  let totalStock = 0

  for (const product of products) {
    const stock = toQuantity(product.actual_stock)
    totalStock += stock

    const tenant = stockByTenant.get(product.tenant_id)
    if (tenant) tenant.stock += stock
  }

  return {
    totalStock,
    byTenant: Array.from(stockByTenant.values()).map((tenant) => ({
      ...tenant,
      percentage: totalStock > 0 ? (tenant.stock / totalStock) * 100 : 0,
    })),
  }
}

export function buildProductStock(products, tenantId) {
  return products
    .filter((product) => product.tenant_id === tenantId)
    .map((product) => ({
      product_id: product.product_id,
      product_name: product.product_name,
      sku: product.sku,
      stock: toQuantity(product.actual_stock),
    }))
}

export function buildReservationAnalytics(tenants, reservations) {
  const totals = Object.fromEntries(
    RESERVATION_STATUSES.map((status) => [status, 0]),
  )
  const byTenant = new Map(
    tenants.map((tenant) => [
      tenant.tenant_id,
      {
        tenant_id: tenant.tenant_id,
        tenant_name: tenant.tenant_name,
        RESERVED: 0,
        COMMITTED: 0,
        RELEASED: 0,
        total: 0,
      },
    ]),
  )

  for (const reservation of reservations) {
    if (!RESERVATION_STATUSES.includes(reservation.status)) continue

    const quantity = toQuantity(reservation.reserved_qty)
    totals[reservation.status] += quantity

    const tenant = byTenant.get(reservation.tenant_id)
    if (tenant) {
      tenant[reservation.status] += quantity
      tenant.total += quantity
    }
  }

  const total = RESERVATION_STATUSES.reduce(
    (sum, status) => sum + totals[status],
    0,
  )

  return {
    total,
    totals,
    statusTotals: RESERVATION_STATUSES.map((status) => ({
      status,
      quantity: totals[status],
      percentage: total > 0 ? (totals[status] / total) * 100 : 0,
    })),
    byTenant: Array.from(byTenant.values()),
  }
}
