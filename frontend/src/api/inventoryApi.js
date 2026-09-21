// Send an HTTP request to the Go API and normalize API errors.
async function request(path, options = {}) {
    const response = await fetch(path, options)

    // DELETE success uses 204 No Content, so there is no JSON body to parse.
    if (response.status === 204) {
        return { data: null }
    }

    if (!response.ok) {
        // Our Go backend currently returns plain-text errors with http.Error().
        const message = await response.text()

        const error = new Error(
            message.trim() || `Request failed with status ${response.status}`,
        )

        error.status = response.status
        throw error
    }

    return response.json()
}

function jsonRequest(method, values) {
    return {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
    }
}

export const inventoryApi = {
    // ---------- Tenants ----------

    async listTenants() {
        return request('/api/tenants')
    },

    async createTenant(values) {
        return request(
            '/api/tenants',
            jsonRequest('POST', {
                tenant_name: values.tenant_name.trim(),
            }),
        )
    },

    async updateTenant(tenantId, values) {
        return request(
            `/api/tenants/${tenantId}`,
            jsonRequest('PUT', {
                tenant_name: values.tenant_name.trim(),
            }),
        )
    },

    async deleteTenant(tenantId) {
        return request(`/api/tenants/${tenantId}`, {
            method: 'DELETE',
        })
    },

    // ---------- Products ----------

    async listProducts() {
        return request('/api/products')
    },

    async createProduct(values) {
        return request(
            '/api/products',
            jsonRequest('POST', {
                tenant_id: Number(values.tenant_id),
                sku: values.sku.trim(),
                product_name: values.product_name.trim(),
                price: Number(values.price),
                actual_stock: Number(values.actual_stock),
            }),
        )
    },

    async updateProduct(productId, values) {
        return request(
            `/api/products/${productId}`,
            jsonRequest('PUT', {
                tenant_id: Number(values.tenant_id),
                sku: values.sku.trim(),
                product_name: values.product_name.trim(),
                price: Number(values.price),
                actual_stock: Number(values.actual_stock),
            }),
        )
    },

    async deleteProduct(productId) {
        return request(`/api/products/${productId}`, {
            method: 'DELETE',
        })
    },

    // ---------- Reservations ----------

    async listReservations() {
        return request('/api/reservations')
    },

    async createReservation(values) {
        return request(
            '/api/reservations',
            jsonRequest('POST', {
                product_id: Number(values.product_id),
                reserved_qty: Number(values.reserved_qty),
                status: values.status,
            }),
        )
    },

    async updateReservation(reservationId, values) {
        return request(
            `/api/reservations/${reservationId}`,
            jsonRequest('PUT', {
                product_id: Number(values.product_id),
                reserved_qty: Number(values.reserved_qty),
                status: values.status,
            }),
        )
    },

    async deleteReservation(reservationId) {
        return request(`/api/reservations/${reservationId}`, {
            method: 'DELETE',
        })
    },
}
