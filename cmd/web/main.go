package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

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

	log.Println("server listening on http://localhost:8080")

	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
