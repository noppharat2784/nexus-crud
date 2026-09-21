import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildProductStock,
  buildReservationAnalytics,
  buildStockAnalytics,
} from './inventoryAnalytics.js'

const tenants = [
  { tenant_id: 1, tenant_name: 'Nexus Store' },
  { tenant_id: 2, tenant_name: 'Game Store' },
  { tenant_id: 3, tenant_name: 'Empty Store' },
]

const products = [
  { product_id: 101, tenant_id: 1, product_name: 'Keyboard', actual_stock: 10 },
  { product_id: 102, tenant_id: 1, product_name: 'Mouse', actual_stock: 20 },
  { product_id: 103, tenant_id: 2, product_name: 'Controller', actual_stock: 5 },
]

test('builds stock totals and keeps empty tenants', () => {
  const result = buildStockAnalytics(tenants, products)

  assert.equal(result.totalStock, 35)
  assert.deepEqual(
    result.byTenant.map(({ tenant_name, stock }) => ({ tenant_name, stock })),
    [
      { tenant_name: 'Nexus Store', stock: 30 },
      { tenant_name: 'Game Store', stock: 5 },
      { tenant_name: 'Empty Store', stock: 0 },
    ],
  )
})

test('filters product stock for the selected tenant', () => {
  assert.deepEqual(
    buildProductStock(products, 2).map(({ product_name, stock }) => ({
      product_name,
      stock,
    })),
    [{ product_name: 'Controller', stock: 5 }],
  )
})

test('sums reserved quantities instead of reservation records', () => {
  const result = buildReservationAnalytics(tenants, [
    { tenant_id: 1, status: 'RESERVED', reserved_qty: 2 },
    { tenant_id: 1, status: 'RESERVED', reserved_qty: 1 },
    { tenant_id: 2, status: 'COMMITTED', reserved_qty: 2 },
  ])

  assert.equal(result.total, 5)
  assert.deepEqual(result.totals, {
    RESERVED: 3,
    COMMITTED: 2,
    RELEASED: 0,
  })
  assert.equal(result.byTenant[2].total, 0)
})
