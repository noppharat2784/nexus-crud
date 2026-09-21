INSERT INTO Tenants (tenant_name)
VALUES
    ('Nexus Store'),
    ('Game Store');

INSERT INTO Products (
    tenant_id,
    sku,
    product_name,
    price,
    actual_stock
)
VALUES
(
    (SELECT tenant_id FROM Tenants WHERE tenant_name = 'Nexus Store' LIMIT 1),
    'KB001',
    'Keyboard',
    990.00,
    10
),
(
    (SELECT tenant_id FROM Tenants WHERE tenant_name = 'Nexus Store' LIMIT 1),
    'MS001',
    'Mouse',
    490.00,
    20
),
(
    (SELECT tenant_id FROM Tenants WHERE tenant_name = 'Game Store' LIMIT 1),
    'CT001',
    'Controller',
    1590.00,
    5
);

INSERT INTO Reservations (
    product_id,
    reserved_qty,
    status
)
VALUES(
    (SELECT product_id FROM Products WHERE sku = 'KB001' LIMIT 1),
    2,
    'RESERVED'
),
(
    (SELECT product_id FROM Products WHERE sku = 'KB001' LIMIT 1),
    1,
    'RESERVED'
),
(
    (SELECT product_id FROM Products WHERE sku = 'CT001' LIMIT 1),
    2,
    'COMMITTED'
);