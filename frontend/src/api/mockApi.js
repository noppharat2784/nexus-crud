const wait = (value, delay = 180) =>
  new Promise((resolve) => window.setTimeout(() => resolve(structuredClone(value)), delay))

const fail = (code, message, status = 400) => {
  const error = new Error(message)
  error.code = code
  error.status = status
  throw error
}

let tenants = [
  { tenant_id: 1, tenant_name: 'Nexus Store' },
  { tenant_id: 2, tenant_name: 'Game Store' },
]

let products = [
  {
    product_id: 101,
    tenant_id: 1,
    sku: 'KB001',
    product_name: 'Keyboard',
    price: 990,
    actual_stock: 10,
  },
  {
    product_id: 102,
    tenant_id: 1,
    sku: 'MS001',
    product_name: 'Mouse',
    price: 490,
    actual_stock: 20,
  },
  {
    product_id: 103,
    tenant_id: 2,
    sku: 'CT001',
    product_name: 'Controller',
    price: 1590,
    actual_stock: 5,
  },
]

let reservations = [
  { reservation_id: 1001, product_id: 101, reserved_qty: 2, status: 'RESERVED' },
  { reservation_id: 1002, product_id: 101, reserved_qty: 1, status: 'RESERVED' },
  { reservation_id: 1003, product_id: 103, reserved_qty: 2, status: 'COMMITTED' },
]

const nextId = (records, key, fallback) =>
  records.length === 0 ? fallback : Math.max(...records.map((record) => record[key])) + 1

const joinedProducts = () =>
  products.map((product) => ({
    ...product,
    tenant_name: tenants.find((tenant) => tenant.tenant_id === product.tenant_id)?.tenant_name ?? 'Unknown',
  }))

const joinedReservations = () =>
  reservations.map((reservation) => {
    const product = products.find((item) => item.product_id === reservation.product_id)
    const tenant = tenants.find((item) => item.tenant_id === product?.tenant_id)

    return {
      ...reservation,
      product_name: product?.product_name ?? 'Unknown',
      tenant_id: tenant?.tenant_id ?? null,
      tenant_name: tenant?.tenant_name ?? 'Unknown',
    }
  })

const validateProduct = (values, productId) => {
  const sku = values.sku.trim().toUpperCase()
  const duplicate = products.some(
    (product) =>
      product.product_id !== productId &&
      product.tenant_id === Number(values.tenant_id) &&
      product.sku.toUpperCase() === sku,
  )

  if (duplicate) {
    fail('PRODUCT_SKU_CONFLICT', 'This SKU already exists for the selected tenant.', 409)
  }
}

export const inventoryApi = {
  async listTenants() {
    return wait({ data: tenants })
  },

  async listProducts() {
    return wait({ data: joinedProducts() })
  },

  async listReservations() {
    return wait({ data: joinedReservations() })
  },

  async createTenant(values) {
    const tenant = {
      tenant_id: nextId(tenants, 'tenant_id', 1),
      tenant_name: values.tenant_name.trim(),
    }
    tenants = [...tenants, tenant]
    return wait({ data: tenant })
  },

  async updateTenant(tenantId, values) {
    tenants = tenants.map((tenant) =>
      tenant.tenant_id === tenantId
        ? { ...tenant, tenant_name: values.tenant_name.trim() }
        : tenant,
    )
    return wait({ data: tenants.find((tenant) => tenant.tenant_id === tenantId) })
  },

  async deleteTenant(tenantId) {
    if (products.some((product) => product.tenant_id === tenantId)) {
      fail('TENANT_HAS_PRODUCTS', 'Remove this tenant’s products before deleting the tenant.', 409)
    }
    tenants = tenants.filter((tenant) => tenant.tenant_id !== tenantId)
    return wait({ data: null })
  },

  async createProduct(values) {
    validateProduct(values)
    const product = {
      product_id: nextId(products, 'product_id', 101),
      tenant_id: Number(values.tenant_id),
      sku: values.sku.trim().toUpperCase(),
      product_name: values.product_name.trim(),
      price: Number(values.price),
      actual_stock: Number(values.actual_stock),
    }
    products = [...products, product]
    return wait({ data: product })
  },

  async updateProduct(productId, values) {
    validateProduct(values, productId)
    products = products.map((product) =>
      product.product_id === productId
        ? {
            ...product,
            tenant_id: Number(values.tenant_id),
            sku: values.sku.trim().toUpperCase(),
            product_name: values.product_name.trim(),
            price: Number(values.price),
            actual_stock: Number(values.actual_stock),
          }
        : product,
    )
    return wait({ data: products.find((product) => product.product_id === productId) })
  },

  async deleteProduct(productId) {
    if (reservations.some((reservation) => reservation.product_id === productId)) {
      fail('PRODUCT_HAS_RESERVATIONS', 'Remove this product’s reservations before deleting the product.', 409)
    }
    products = products.filter((product) => product.product_id !== productId)
    return wait({ data: null })
  },

  async createReservation(values) {
    const reservation = {
      reservation_id: nextId(reservations, 'reservation_id', 1001),
      product_id: Number(values.product_id),
      reserved_qty: Number(values.reserved_qty),
      status: values.status,
    }
    reservations = [...reservations, reservation]
    return wait({ data: reservation })
  },

  async updateReservation(reservationId, values) {
    reservations = reservations.map((reservation) =>
      reservation.reservation_id === reservationId
        ? {
            ...reservation,
            product_id: Number(values.product_id),
            reserved_qty: Number(values.reserved_qty),
            status: values.status,
          }
        : reservation,
    )
    return wait({
      data: reservations.find((reservation) => reservation.reservation_id === reservationId),
    })
  },

  async deleteReservation(reservationId) {
    reservations = reservations.filter(
      (reservation) => reservation.reservation_id !== reservationId,
    )
    return wait({ data: null })
  },
}
