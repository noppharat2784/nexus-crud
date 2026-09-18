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
	// Route 3: GET /api/products/{id}
	http.HandleFunc("/api/products/{id}", func(w http.ResponseWriter, r *http.Request) {
		// Product Detail

		if r.Method != http.MethodGet {
			http.Error(
				w,
				"method not allowed",
				http.StatusMethodNotAllowed,
			)
			return
		}

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
	})

	log.Println("server listening on http://localhost:8080")

	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
