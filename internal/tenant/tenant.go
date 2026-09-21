package tenant

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// TenantListItem represents the Tenant data returned by the API.
// Product forms can use tenant_id as the real value
// while displaying tenant_name to the user.
type TenantListItem struct {
	TenantID   int64  `json:"tenant_id"`
	TenantName string `json:"tenant_name"`
}

type CreateTenantInput struct {
	TenantName string `json:"tenant_name"`
}

type UpdateTenantInput struct {
	TenantName string `json:"tenant_name"`
}

// List returns all Tenants ordered by their primary key.
func List(
	ctx context.Context,
	db *pgxpool.Pool,
) ([]TenantListItem, error) {
	rows, err := db.Query(ctx, `
		SELECT
			tenant_id,
			tenant_name
		FROM tenants
		ORDER BY tenant_id;
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Use an empty slice so an empty table becomes [] in JSON
	// instead of null.
	tenants := make([]TenantListItem, 0)

	for rows.Next() {
		var t TenantListItem

		if err := rows.Scan(
			&t.TenantID,
			&t.TenantName,
		); err != nil {
			return nil, err
		}

		tenants = append(tenants, t)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return tenants, nil
}

func Create(
	ctx context.Context,
	db *pgxpool.Pool,
	input CreateTenantInput,
) (int64, error) {
	var tenantID int64

	err := db.QueryRow(
		ctx,
		`
		INSERT INTO tenants (tenant_name)
		VALUES ($1)
		RETURNING tenant_id;
		`,
		input.TenantName,
	).Scan(&tenantID)

	if err != nil {
		return 0, err
	}

	return tenantID, nil
}

func Update(
	ctx context.Context,
	db *pgxpool.Pool,
	tenantID int64,
	input UpdateTenantInput,
) error {
	result, err := db.Exec(
		ctx,
		`
		UPDATE tenants
		SET tenant_name = $1
		WHERE tenant_id = $2;
		`,
		input.TenantName,
		tenantID,
	)

	if err != nil {
		return err
	}

	rowsAffected := result.RowsAffected()

	if rowsAffected == 0 {
		return pgx.ErrNoRows
	}

	return nil
}

func Delete(
	ctx context.Context,
	db *pgxpool.Pool,
	tenantID int64,
) error {
	result, err := db.Exec(
		ctx,
		`
		DELETE FROM tenants
		WHERE tenant_id = $1;
		`,
		tenantID,
	)

	if err != nil {
		return err
	}

	rowsAffected := result.RowsAffected()

	if rowsAffected == 0 {
		return pgx.ErrNoRows
	}

	return nil
}
