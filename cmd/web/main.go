package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"

	"github.com/noppharat2784/nexus-crud/internal/database"
	"github.com/noppharat2784/nexus-crud/internal/product"
	"github.com/noppharat2784/nexus-crud/internal/reservation"
	"github.com/noppharat2784/nexus-crud/internal/tenant"
)

// isValidReservationStatus keeps the application-level status rule
// consistent with the CHECK constraint in PostgreSQL.
func isValidReservationStatus(status string) bool {
	switch status {
	case "RESERVED", "COMMITTED", "RELEASED":
		return true
	default:
		return false
	}
}

func main() {
	ctx := context.Background()

	db, err := database.Open(ctx)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	log.Println("connected to PostgreSQL successfully")

	http.HandleFunc("/api/products", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {

		// Route 1: GET /api/products
		case http.MethodGet:
			// List Products
			products, err := product.List(r.Context(), db)
			if err != nil {
				log.Printf("list products: %v", err)
				http.Error(
					w,
					"internal server error",
					http.StatusInternalServerError,
				)
				return
			}

			response := struct {
				Data []product.ProductListItem `json:"data"`
			}{
				Data: products,
			}

			w.Header().Set("Content-Type", "application/json")

			if err := json.NewEncoder(w).Encode(response); err != nil {
				log.Printf("encode response: %v", err)
			}

		// Route 2: POST /api/products
		case http.MethodPost:
			// Create Product
			var input product.CreateProductInput

			if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
				http.Error(
					w,
					"invalid request body",
					http.StatusBadRequest,
				)
				return
			}

			input.SKU = strings.TrimSpace(input.SKU)
			input.ProductName = strings.TrimSpace(input.ProductName)

			if input.TenantID <= 0 {
				http.Error(
					w,
					"invalid tenant_id",
					http.StatusBadRequest,
				)
				return
			}

			if input.SKU == "" {
				http.Error(
					w,
					"sku is required",
					http.StatusBadRequest,
				)
				return
			}

			if input.ProductName == "" {
				http.Error(
					w,
					"product_name is required",
					http.StatusBadRequest,
				)
				return
			}

			if input.Price < 0 {
				http.Error(
					w,
					"price must be >= 0",
					http.StatusBadRequest,
				)
				return
			}

			if input.ActualStock < 0 {
				http.Error(
					w,
					"actual_stock must be >= 0",
					http.StatusBadRequest,
				)
				return
			}

			productID, err := product.Create(
				r.Context(),
				db,
				input,
			)
			if err != nil {
				log.Printf("create product: %v", err)
				http.Error(
					w,
					"internal server error",
					http.StatusInternalServerError,
				)
				return
			}

			createdProduct, err := product.GetByID(
				r.Context(),
				db,
				productID,
			)
			if err != nil {
				log.Printf("get created product: %v", err)
				http.Error(
					w,
					"internal server error",
					http.StatusInternalServerError,
				)
				return
			}

			response := struct {
				Data product.ProductListItem `json:"data"`
			}{
				Data: createdProduct,
			}

			w.Header().Set("Content-Type", "application/json")

			w.WriteHeader(http.StatusCreated)

			if err := json.NewEncoder(w).Encode(response); err != nil {
				log.Printf("encode response: %v", err)
			}

		default:
			http.Error(
				w,
				"method not allowed",
				http.StatusMethodNotAllowed,
			)
		}
	})
	// Route 3-4
	// GET = อ่าน Product , PUT = แก้ไข Product
	http.HandleFunc("/api/products/{id}", func(w http.ResponseWriter, r *http.Request) {
		// GET และ PUT ต้องระบุ{id} product
		idText := r.PathValue("id")

		productID, err := strconv.ParseInt(idText, 10, 64)
		if err != nil {
			http.Error(
				w,
				"invalid product id",
				http.StatusBadRequest,
			)
			return
		}

		switch r.Method {

		// Route 3: GET /api/products/{id}
		case http.MethodGet:

			// Get Product Detail by ID.
			p, err := product.GetByID(
				r.Context(),
				db,
				productID,
			)

			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					http.Error(
						w,
						"product not found",
						http.StatusNotFound,
					)
					return
				}

				log.Printf("get product: %v", err)

				http.Error(
					w,
					"internal server error",
					http.StatusInternalServerError,
				)
				return
			}

			response := struct {
				Data product.ProductListItem `json:"data"`
			}{
				Data: p,
			}

			w.Header().Set(
				"Content-Type",
				"application/json",
			)

			if err := json.NewEncoder(w).Encode(response); err != nil {
				log.Printf("encode response: %v", err)
			}
			// Route 4: PUT /api/products/{id}
		case http.MethodPut:
			var input product.UpdateProductInput

			// Request Body JSON → Go struct
			if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
				http.Error(
					w,
					"invalid request body",
					http.StatusBadRequest,
				)
				return
			}

			// Normalize string values before validation
			input.SKU = strings.TrimSpace(input.SKU)
			input.ProductName = strings.TrimSpace(input.ProductName)

			// Validate the complete Product state supplied by PUT
			if input.TenantID <= 0 {
				http.Error(
					w,
					"invalid tenant_id",
					http.StatusBadRequest,
				)
				return
			}

			if input.SKU == "" {
				http.Error(
					w,
					"sku is required",
					http.StatusBadRequest,
				)
				return
			}

			if input.ProductName == "" {
				http.Error(
					w,
					"product_name is required",
					http.StatusBadRequest,
				)
				return
			}

			if input.Price < 0 {
				http.Error(
					w,
					"price must be >= 0",
					http.StatusBadRequest,
				)
				return
			}

			if input.ActualStock < 0 {
				http.Error(
					w,
					"actual_stock must be >= 0",
					http.StatusBadRequest,
				)
				return
			}

			// Execute UPDATE against the existing Product.
			err := product.Update(
				r.Context(),
				db,
				productID,
				input,
			)
			if err != nil {
				// UPDATE ที่ match 0 rows หมายถึง Product ไม่มีอยู่
				if errors.Is(err, pgx.ErrNoRows) {
					http.Error(
						w,
						"product not found",
						http.StatusNotFound,
					)
					return
				}

				log.Printf("update product: %v", err)
				http.Error(
					w,
					"internal server error",
					http.StatusInternalServerError,
				)
				return
			}

			// อ่าน Product อีกครั้งเพื่อคืน current state หลัง UPDATE
			updatedProduct, err := product.GetByID(
				r.Context(),
				db,
				productID,
			)
			if err != nil {
				log.Printf("get updated product: %v", err)
				http.Error(
					w,
					"internal server error",
					http.StatusInternalServerError,
				)
				return
			}

			response := struct {
				Data product.ProductListItem `json:"data"`
			}{
				Data: updatedProduct,
			}

			w.Header().Set("Content-Type", "application/json")

			if err := json.NewEncoder(w).Encode(response); err != nil {
				log.Printf("encode response: %v", err)
			}

		// Route 5: DELETE /api/products/{id}
		case http.MethodDelete:
			err := product.Delete(
				r.Context(),
				db,
				productID,
			)
			if err != nil {
				// DELETE ที่ match 0 rows หมายถึง Product ไม่มีอยู่
				if errors.Is(err, pgx.ErrNoRows) {
					http.Error(
						w,
						"product not found",
						http.StatusNotFound,
					)
					return
				}

				log.Printf("delete product: %v", err)
				http.Error(
					w,
					"internal server error",
					http.StatusInternalServerError,
				)
				return
			}

			// DELETE สำเร็จและไม่มี response body
			w.WriteHeader(http.StatusNoContent)

		default:
			http.Error(
				w,
				"method not allowed",
				http.StatusMethodNotAllowed,
			)
		}
	})
	http.HandleFunc("/api/tenants", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			tenants, err := tenant.List(r.Context(), db)
			if err != nil {
				log.Printf("list tenants: %v", err)
				http.Error(
					w,
					"internal server error",
					http.StatusInternalServerError,
				)
				return
			}

			w.Header().Set("Content-Type", "application/json")

			response := struct {
				Data []tenant.TenantListItem `json:"data"`
			}{
				Data: tenants,
			}

			if err := json.NewEncoder(w).Encode(response); err != nil {
				log.Printf("encode tenants response: %v", err)
			}

		case http.MethodPost:
			var input tenant.CreateTenantInput

			if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
				http.Error(
					w,
					"invalid JSON body",
					http.StatusBadRequest,
				)
				return
			}

			input.TenantName = strings.TrimSpace(input.TenantName)

			if input.TenantName == "" {
				http.Error(
					w,
					"tenant_name is required",
					http.StatusBadRequest,
				)
				return
			}

			tenantID, err := tenant.Create(
				r.Context(),
				db,
				input,
			)
			if err != nil {
				log.Printf("create tenant: %v", err)

				http.Error(
					w,
					"internal server error",
					http.StatusInternalServerError,
				)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusCreated)

			response := struct {
				Data tenant.TenantListItem `json:"data"`
			}{
				Data: tenant.TenantListItem{
					TenantID:   tenantID,
					TenantName: input.TenantName,
				},
			}

			if err := json.NewEncoder(w).Encode(response); err != nil {
				log.Printf("encode create tenant response: %v", err)
			}

		default:
			http.Error(
				w,
				"method not allowed",
				http.StatusMethodNotAllowed,
			)
		}
	})

	http.HandleFunc("/api/tenants/{id}", func(w http.ResponseWriter, r *http.Request) {
		tenantID, err := strconv.ParseInt(
			r.PathValue("id"),
			10,
			64,
		)

		if err != nil || tenantID <= 0 {
			http.Error(
				w,
				"invalid tenant id",
				http.StatusBadRequest,
			)
			return
		}

		switch r.Method {
		case http.MethodPut:
			var input tenant.UpdateTenantInput

			if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
				http.Error(
					w,
					"invalid JSON body",
					http.StatusBadRequest,
				)
				return
			}

			input.TenantName = strings.TrimSpace(input.TenantName)

			if input.TenantName == "" {
				http.Error(
					w,
					"tenant_name is required",
					http.StatusBadRequest,
				)
				return
			}

			err := tenant.Update(
				r.Context(),
				db,
				tenantID,
				input,
			)

			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					http.Error(
						w,
						"tenant not found",
						http.StatusNotFound,
					)
					return
				}

				log.Printf("update tenant: %v", err)

				http.Error(
					w,
					"internal server error",
					http.StatusInternalServerError,
				)
				return
			}

			w.Header().Set("Content-Type", "application/json")

			response := struct {
				Data tenant.TenantListItem `json:"data"`
			}{
				Data: tenant.TenantListItem{
					TenantID:   tenantID,
					TenantName: input.TenantName,
				},
			}

			if err := json.NewEncoder(w).Encode(response); err != nil {
				log.Printf("encode update tenant response: %v", err)
			}

		case http.MethodDelete:
			err := tenant.Delete(
				r.Context(),
				db,
				tenantID,
			)

			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					http.Error(
						w,
						"tenant not found",
						http.StatusNotFound,
					)
					return
				}

				log.Printf("delete tenant: %v", err)

				http.Error(
					w,
					"internal server error",
					http.StatusInternalServerError,
				)
				return
			}

			w.WriteHeader(http.StatusNoContent)

		default:
			http.Error(
				w,
				"method not allowed",
				http.StatusMethodNotAllowed,
			)
		}
	})

	// /api/reservations is the Reservation collection endpoint.
	//
	// GET  = list Reservations
	// POST = create a Reservation
	http.HandleFunc("/api/reservations", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {

		// Route 7: GET /api/reservations
		case http.MethodGet:
			reservations, err := reservation.List(
				r.Context(),
				db,
			)
			if err != nil {
				log.Printf("list reservations: %v", err)
				http.Error(
					w,
					"internal server error",
					http.StatusInternalServerError,
				)
				return
			}

			response := struct {
				Data []reservation.ReservationListItem `json:"data"`
			}{
				Data: reservations,
			}

			w.Header().Set("Content-Type", "application/json")

			if err := json.NewEncoder(w).Encode(response); err != nil {
				log.Printf("encode response: %v", err)
			}

		// Route 8: POST /api/reservations
		case http.MethodPost:
			var input reservation.CreateReservationInput

			// HTTP JSON request body → Go struct
			if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
				http.Error(
					w,
					"invalid request body",
					http.StatusBadRequest,
				)
				return
			}

			// Normalize status so values such as "reserved"
			// become the canonical "RESERVED".
			input.Status = strings.ToUpper(
				strings.TrimSpace(input.Status),
			)

			if input.ProductID <= 0 {
				http.Error(
					w,
					"invalid product_id",
					http.StatusBadRequest,
				)
				return
			}

			if input.ReservedQty <= 0 {
				http.Error(
					w,
					"reserved_qty must be > 0",
					http.StatusBadRequest,
				)
				return
			}

			if !isValidReservationStatus(input.Status) {
				http.Error(
					w,
					"invalid reservation status",
					http.StatusBadRequest,
				)
				return
			}

			// Active Reservation states must not exceed currently available stock.
			// RELEASED does not consume stock.
			if input.Status != "RELEASED" {
				availableStock, err := reservation.GetAvailableStock(
					r.Context(),
					db,
					input.ProductID,
				)
				if err != nil {
					if errors.Is(err, pgx.ErrNoRows) {
						http.Error(
							w,
							"product not found",
							http.StatusNotFound,
						)
						return
					}

					log.Printf("get available stock: %v", err)
					http.Error(
						w,
						"internal server error",
						http.StatusInternalServerError,
					)
					return
				}

				if input.ReservedQty > availableStock {
					http.Error(
						w,
						"reserved quantity exceeds available stock",
						http.StatusConflict,
					)
					return
				}
			}

			reservationID, err := reservation.Create(
				r.Context(),
				db,
				input,
			)
			if err != nil {
				log.Printf("create reservation: %v", err)
				http.Error(
					w,
					"internal server error",
					http.StatusInternalServerError,
				)
				return
			}

			// Fetch the newly created row so the API returns
			// Product and Tenant display information as well.
			createdReservation, err := reservation.GetByID(
				r.Context(),
				db,
				reservationID,
			)
			if err != nil {
				log.Printf("get created reservation: %v", err)
				http.Error(
					w,
					"internal server error",
					http.StatusInternalServerError,
				)
				return
			}

			response := struct {
				Data reservation.ReservationListItem `json:"data"`
			}{
				Data: createdReservation,
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusCreated)

			if err := json.NewEncoder(w).Encode(response); err != nil {
				log.Printf("encode response: %v", err)
			}

		default:
			http.Error(
				w,
				"method not allowed",
				http.StatusMethodNotAllowed,
			)
		}
	})

	// /api/reservations/{id} operates on one Reservation.
	//
	// GET    = detail
	// PUT    = update
	// DELETE = delete
	http.HandleFunc("/api/reservations/{id}", func(w http.ResponseWriter, r *http.Request) {
		idText := r.PathValue("id")

		reservationID, err := strconv.ParseInt(idText, 10, 64)
		if err != nil {
			http.Error(
				w,
				"invalid reservation id",
				http.StatusBadRequest,
			)
			return
		}

		switch r.Method {

		// Route 9: GET /api/reservations/{id}
		case http.MethodGet:
			item, err := reservation.GetByID(
				r.Context(),
				db,
				reservationID,
			)
			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					http.Error(
						w,
						"reservation not found",
						http.StatusNotFound,
					)
					return
				}

				log.Printf("get reservation: %v", err)
				http.Error(
					w,
					"internal server error",
					http.StatusInternalServerError,
				)
				return
			}

			response := struct {
				Data reservation.ReservationListItem `json:"data"`
			}{
				Data: item,
			}

			w.Header().Set("Content-Type", "application/json")

			if err := json.NewEncoder(w).Encode(response); err != nil {
				log.Printf("encode response: %v", err)
			}

		// Route 10: PUT /api/reservations/{id}
		case http.MethodPut:
			var input reservation.UpdateReservationInput

			if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
				http.Error(
					w,
					"invalid request body",
					http.StatusBadRequest,
				)
				return
			}

			input.Status = strings.ToUpper(
				strings.TrimSpace(input.Status),
			)

			if input.ProductID <= 0 {
				http.Error(
					w,
					"invalid product_id",
					http.StatusBadRequest,
				)
				return
			}

			if input.ReservedQty <= 0 {
				http.Error(
					w,
					"reserved_qty must be > 0",
					http.StatusBadRequest,
				)
				return
			}

			if !isValidReservationStatus(input.Status) {
				http.Error(
					w,
					"invalid reservation status",
					http.StatusBadRequest,
				)
				return
			}

			// Exclude the Reservation currently being edited
			// so its existing quantity is not counted twice.
			if input.Status != "RELEASED" {
				availableStock, err := reservation.GetAvailableStockForUpdate(
					r.Context(),
					db,
					input.ProductID,
					reservationID,
				)
				if err != nil {
					if errors.Is(err, pgx.ErrNoRows) {
						http.Error(
							w,
							"product not found",
							http.StatusNotFound,
						)
						return
					}

					log.Printf("get available stock for update: %v", err)
					http.Error(
						w,
						"internal server error",
						http.StatusInternalServerError,
					)
					return
				}

				if input.ReservedQty > availableStock {
					http.Error(
						w,
						"reserved quantity exceeds available stock",
						http.StatusConflict,
					)
					return
				}
			}

			err := reservation.Update(
				r.Context(),
				db,
				reservationID,
				input,
			)
			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					http.Error(
						w,
						"reservation not found",
						http.StatusNotFound,
					)
					return
				}

				log.Printf("update reservation: %v", err)
				http.Error(
					w,
					"internal server error",
					http.StatusInternalServerError,
				)
				return
			}

			updatedReservation, err := reservation.GetByID(
				r.Context(),
				db,
				reservationID,
			)
			if err != nil {
				log.Printf("get updated reservation: %v", err)
				http.Error(
					w,
					"internal server error",
					http.StatusInternalServerError,
				)
				return
			}

			response := struct {
				Data reservation.ReservationListItem `json:"data"`
			}{
				Data: updatedReservation,
			}

			w.Header().Set("Content-Type", "application/json")

			if err := json.NewEncoder(w).Encode(response); err != nil {
				log.Printf("encode response: %v", err)
			}

		// Route 11: DELETE /api/reservations/{id}
		case http.MethodDelete:
			err := reservation.Delete(
				r.Context(),
				db,
				reservationID,
			)
			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					http.Error(
						w,
						"reservation not found",
						http.StatusNotFound,
					)
					return
				}

				log.Printf("delete reservation: %v", err)
				http.Error(
					w,
					"internal server error",
					http.StatusInternalServerError,
				)
				return
			}

			// Successful DELETE returns no response body.
			w.WriteHeader(http.StatusNoContent)

		default:
			http.Error(
				w,
				"method not allowed",
				http.StatusMethodNotAllowed,
			)
		}
	})

	// Start HTTP server after all routes are registered.
	log.Println("server listening on http://localhost:8080")

	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
