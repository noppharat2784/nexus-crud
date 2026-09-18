package product

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ProductListItem struct {
	ProductID   int64   `json:"product_id"`
	TenantID    int64   `json:"tenant_id"`
	TenantName  string  `json:"tenant_name"`
	SKU         string  `json:"sku"`
	ProductName string  `json:"product_name"`
	Price       float64 `json:"price"`
	ActualStock int     `json:"actual_stock"`
}

func List(ctx context.Context, db *pgxpool.Pool) ([]ProductListItem, error) {
	rows, err := db.Query(ctx, `
	SELECT
		p.product_id,
		p.tenant_id,
		t.tenant_name,
		p.sku,
		p.product_name,
		p.price,
		p.actual_stock

	FROM products p
	JOIN tenants t
		ON p.tenant_id = t.tenant_id
	ORDER BY p.product_id;
	
`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []ProductListItem

	for rows.Next() {
		var p ProductListItem

		err := rows.Scan(
			&p.ProductID,
			&p.TenantID,
			&p.TenantName,
			&p.SKU,
			&p.ProductName,
			&p.Price,
			&p.ActualStock,
		)
		if err != nil {
			return nil, err
		}
		products = append(products, p)

	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return products, nil
}

func GetByID(
	ctx context.Context,
	db *pgxpool.Pool,
	productID int64,
) (ProductListItem, error) {
	var p ProductListItem

	err := db.QueryRow(ctx, `
		SELECT
			p.product_id,
			p.tenant_id,
			t.tenant_name,
			p.sku,
			p.product_name,
			p.price,
			p.actual_stock
		FROM products p
		JOIN tenants t
			ON p.tenant_id = t.tenant_id
		WHERE p.product_id = $1;
	`, productID).Scan(
		&p.ProductID,
		&p.TenantID,
		&p.TenantName,
		&p.SKU,
		&p.ProductName,
		&p.Price,
		&p.ActualStock,
	)

	if err != nil {
		return ProductListItem{}, err
	}

	return p, nil
}
