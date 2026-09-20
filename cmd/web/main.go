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
)

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

	// Start HTTP server after all routes are registered.
	log.Println("server listening on http://localhost:8080")

	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
