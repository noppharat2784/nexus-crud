package stockmovement

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type StockMovementListItem struct {
	MovementID  int64  `json:"movement_id"`
	ProductID   int64  `json:"product_id"`
	TenantID    int64  `json:"tenant_id"`
	TenantName  string `json:"tenant_name"`
	SKU         string `json:"sku"`
	ProductName string `json:"product_name"`
	MovementType string `json:"movement_type"`
	Quantity     int    `json:"quantity"`
	StockBefore  int    `json:"stock_before"`
	StockAfter   int    `json:"stock_after"`
	CreatedAt    string `json:"created_at"`
}

type CreateStockMovementInput struct {
	ProductID    int64  `json:"product_id"`
	MovementType string `json:"movement_type"`
	Quantity     int    `json:"quantity"`
}

func List(
	ctx context.Context,
	db *pgxpool.Pool,
) ([]StockMovementListItem, error) {
	rows, err := db.Query(
		ctx,
		`
		SELECT
			sm.movement_id,
			sm.product_id,
			p.tenant_id,
			t.tenant_name,
			p.sku,
			p.product_name,
			sm.movement_type,
			sm.quantity,
			sm.stock_before,
			sm.stock_after,
			sm.created_at::text
		FROM stock_movements sm
		JOIN products p
			ON p.product_id = sm.product_id
		JOIN tenants t
			ON t.tenant_id = p.tenant_id
		ORDER BY sm.movement_id DESC;
		`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	movements := make([]StockMovementListItem, 0)

	for rows.Next() {
		var item StockMovementListItem

		if err := rows.Scan(
			&item.MovementID,
			&item.ProductID,
			&item.TenantID,
			&item.TenantName,
			&item.SKU,
			&item.ProductName,
			&item.MovementType,
			&item.Quantity,
			&item.StockBefore,
			&item.StockAfter,
			&item.CreatedAt,
		); err != nil {
			return nil, err
		}

		movements = append(movements, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return movements, nil
}

func Create(
	ctx context.Context,
	db *pgxpool.Pool,
	input CreateStockMovementInput,
) (int64, error) {
	tx, err := db.Begin(ctx)
	if err != nil {
		return 0, err
	}

	defer func() {
		_ = tx.Rollback(ctx)
	}()

	var actualStock int

	err = tx.QueryRow(
		ctx,
		`
		SELECT actual_stock
		FROM products
		WHERE product_id = $1
		FOR UPDATE;
		`,
		input.ProductID,
	).Scan(&actualStock)

	if err != nil {
		return 0, err
	}

	stockBefore := actualStock
	stockAfter := actualStock

	switch input.MovementType {
	case "IN":
		stockAfter = stockBefore + input.Quantity

	case "OUT":
		var reservedStock int

		err = tx.QueryRow(
			ctx,
			`
			SELECT COALESCE(
				SUM(reserved_qty)
					FILTER (
						WHERE status IN ('RESERVED', 'COMMITTED')
					),
				0
			)
			FROM reservations
			WHERE product_id = $1;
			`,
			input.ProductID,
		).Scan(&reservedStock)

		if err != nil {
			return 0, err
		}

		availableStock := stockBefore - reservedStock

		if input.Quantity > availableStock {
			return 0, ErrInsufficientStock
		}

		stockAfter = stockBefore - input.Quantity
	}

	_, err = tx.Exec(
		ctx,
		`
		UPDATE products
		SET actual_stock = $1
		WHERE product_id = $2;
		`,
		stockAfter,
		input.ProductID,
	)

	if err != nil {
		return 0, err
	}

	var movementID int64

	err = tx.QueryRow(
		ctx,
		`
		INSERT INTO stock_movements (
			product_id,
			movement_type,
			quantity,
			stock_before,
			stock_after
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING movement_id;
		`,
		input.ProductID,
		input.MovementType,
		input.Quantity,
		stockBefore,
		stockAfter,
	).Scan(&movementID)

	if err != nil {
		return 0, err
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}

	return movementID, nil
}

func GetByID(
	ctx context.Context,
	db *pgxpool.Pool,
	movementID int64,
) (StockMovementListItem, error) {
	var item StockMovementListItem

	err := db.QueryRow(
		ctx,
		`
		SELECT
			sm.movement_id,
			sm.product_id,
			p.tenant_id,
			t.tenant_name,
			p.sku,
			p.product_name,
			sm.movement_type,
			sm.quantity,
			sm.stock_before,
			sm.stock_after,
			sm.created_at::text
		FROM stock_movements sm
		JOIN products p
			ON p.product_id = sm.product_id
		JOIN tenants t
			ON t.tenant_id = p.tenant_id
		WHERE sm.movement_id = $1;
		`,
		movementID,
	).Scan(
		&item.MovementID,
		&item.ProductID,
		&item.TenantID,
		&item.TenantName,
		&item.SKU,
		&item.ProductName,
		&item.MovementType,
		&item.Quantity,
		&item.StockBefore,
		&item.StockAfter,
		&item.CreatedAt,
	)

	if err != nil {
		return StockMovementListItem{}, err
	}

	return item, nil
}

var ErrInsufficientStock = errors.New("insufficient available stock")

var _ = pgx.ErrNoRows
