package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

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

	// Route 1: GET /api/products
	http.HandleFunc("/api/products", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

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
	})

	// Route 2: GET /api/products/{id}
	http.HandleFunc("/api/products/{id}", func(w http.ResponseWriter, r *http.Request) {
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
