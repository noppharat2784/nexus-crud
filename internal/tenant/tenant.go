package tenant

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// TenantListItem represents the Tenant data returned by the API.
// Product forms can use tenant_id as the real value
// while displaying tenant_name to the user.
type TenantListItem struct {
	TenantID   int64  `json:"tenant_id"`
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
