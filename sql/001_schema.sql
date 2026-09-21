CREATE TABLE Tenants (

    tenant_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_name VARCHAR(100) NOT NULL 

);

CREATE TABLE Products (

    product_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    sku VARCHAR(50) NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    actual_stock INT NOT NULL,

    FOREIGN KEY (tenant_id)
        REFERENCES Tenants(tenant_id),

    UNIQUE (tenant_id, sku),

    CHECK (price >= 0),
    CHECK (actual_stock >= 0)

);

CREATE TABLE Stock_Movements (
    movement_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id BIGINT NOT NULL,
    movement_type VARCHAR(10) NOT NULL,
    quantity INT NOT NULL,
    stock_before INT NOT NULL,
    stock_after INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id)
        REFERENCES Products(product_id),

    CHECK (movement_type IN ('IN', 'OUT')),
    CHECK (quantity > 0),
    CHECK (stock_before >= 0),
    CHECK (stock_after >= 0)
);

CREATE TABLE Reservations (
    
    reservation_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id BIGINT NOT NULL,
    reserved_qty INT NOT NULL,
    status VARCHAR(20) NOT NULL,

    FOREIGN KEY (product_id)
        REFERENCES Products(product_id),

    CHECK (reserved_qty > 0),

    CHECK (
        status IN ('RESERVED', 'COMMITTED', 'RELEASED')
    )

);
