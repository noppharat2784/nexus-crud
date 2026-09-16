# Nexus CRUD — Shared Contract

**Status:** V1 Team Baseline  
**Architecture:** React + Tailwind CSS + Go REST API + PostgreSQL  
**Frontend:** React SPA + Vite + Tailwind CSS  
**Backend:** Go  
**Database:** PostgreSQL  

---

# 1. Project Goal

Nexus CRUD เป็น Web Application สำหรับเรียนรู้ Advanced Database และ Backend System ผ่านโดเมน Inventory

V1 ต้องสามารถ:

- จัดการ Tenant
- จัดการ Product
- จัดการ Reservation Record
- Query ข้อมูลจาก PostgreSQL
- แสดงข้อมูลผ่าน React UI
- เชื่อม React กับ Go ผ่าน JSON API
- ใช้ JOIN / Aggregate / View ในส่วน Report

Nexus CRUD V1 **ไม่ใช่ Nexus Thesis Production System**

ยังไม่รวม:

- Redis
- Payment
- Order
- Saga
- Microservices
- Production Authentication
- Atomic Reservation เต็มรูปแบบ
- Distributed System

Transaction / Concurrency / Atomic Reservation จะถูกเพิ่มใน Milestone หลังจากเรียนบทที่เกี่ยวข้อง

---

# 2. System Architecture

```text
                 Browser
                    │
                    ▼
          React + Tailwind CSS
              Frontend SPA
                    │
                    │ HTTP / JSON
                    ▼
               Go REST API
                    │
                    ▼
               PostgreSQL
          ┌─────────┼──────────┐
          ▼         ▼          ▼
       TENANTS   PRODUCTS   RESERVATIONS
```

หลักสำคัญ:

```text
React
→ ไม่คุยกับ PostgreSQL โดยตรง

React
→ เรียก Go API

Go
→ Query PostgreSQL

PostgreSQL
→ Source of stored facts
```

---

# 3. Responsibility Boundary

## Frontend

React รับผิดชอบ:

- Page layout
- Navigation
- Tables
- Forms
- Buttons
- Loading state
- Empty state
- Error state
- Client-side interaction
- เรียก Backend API
- แสดงข้อมูลจาก JSON

Frontend **ไม่ใช่ Source of Truth ของ Business Rules**

---

## Backend

Go รับผิดชอบ:

- API endpoints
- Request validation
- Query PostgreSQL
- Map Database result → JSON
- Database error handling
- Application rules
- Transaction boundary ใน Milestone ภายหลัง

---

## Database

PostgreSQL รับผิดชอบ:

- Persist Data
- Primary Key
- Foreign Key
- NOT NULL
- UNIQUE
- CHECK
- Referential Integrity
- Transaction / Concurrency Control ใน Milestone ภายหลัง

---

# 4. Core Data Model

```text
TENANTS
   1
   │
   M
PRODUCTS
   1
   │
   M
RESERVATIONS
```

---

# 5. Entity Contract

## 5.1 Tenant

```text
Tenant
────────────────
tenant_id
tenant_name
```

### Rules

```text
tenant_id
→ Primary Key

tenant_name
→ Required
```

---

## 5.2 Product

```text
Product
────────────────
product_id
tenant_id
sku
product_name
price
actual_stock
```

### Rules

```text
product_id
→ Primary Key

tenant_id
→ Foreign Key → tenants

(tenant_id, sku)
→ UNIQUE

product_name
→ NOT NULL

price
→ >= 0

actual_stock
→ >= 0
```

---

## 5.3 Reservation

```text
Reservation
────────────────
reservation_id
product_id
reserved_qty
status
```

Valid Status:

```text
RESERVED
COMMITTED
RELEASED
```

Rules:

```text
reservation_id
→ Primary Key

product_id
→ Foreign Key → products

reserved_qty
→ > 0

status
→ ต้องอยู่ในชุดที่กำหนด
```

### V1 Limitation

Reservation ใน V1 เป็น **Basic Reservation Record**

ยังไม่ถือว่าเป็น Concurrency-safe Reservation Operation

```text
NOT CONCURRENCY SAFE YET
```

Atomic Reservation จะถูกเพิ่มภายหลัง

---

# 6. Naming Contract

## PostgreSQL

ใช้:

```text
snake_case
```

เช่น:

```text
product_id
tenant_id
product_name
actual_stock
reserved_qty
```

---

## Go

ใช้:

```text
ProductID
TenantID
ProductName
ActualStock
ReservedQty
```

---

## JSON API

ใช้:

```text
snake_case
```

ตัวอย่าง:

```json
{
  "product_id": 101,
  "tenant_id": 1,
  "product_name": "Keyboard",
  "actual_stock": 10
}
```

---

## React

JavaScript variable สามารถใช้:

```text
camelCase
```

แต่ข้อมูลที่รับจาก API ให้คงชื่อ Contract จาก JSON ไว้ก่อนใน V1 เพื่อไม่สร้าง Mapping ที่ไม่จำเป็น

---

# 7. API Boundary

Frontend ห้าม Query Database โดยตรง

ทุก Request ต้องผ่าน:

```text
React
 ↓
/api/...
 ↓
Go
 ↓
PostgreSQL
```

API Prefix:

```text
/api
```

---

# 8. Standard API Response

## Success — Single Resource

```json
{
  "data": {
    "product_id": 101,
    "product_name": "Keyboard"
  }
}
```

## Success — Collection

```json
{
  "data": [
    {
      "product_id": 101,
      "product_name": "Keyboard"
    }
  ]
}
```

## Error

```json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found"
  }
}
```

Frontend ไม่ควรต้องอ่าน Raw PostgreSQL Error

เช่นไม่ควรแสดง:

```text
violates foreign key constraint fk_products_tenant
```

แต่ Backend ควรแปลงเป็นข้อความที่เข้าใจได้

---

# 9. HTTP Status Contract

ใช้หลักเบื้องต้น:

```text
200 OK
→ อ่าน / Update สำเร็จ

201 Created
→ Create สำเร็จ

204 No Content
→ Delete สำเร็จ

400 Bad Request
→ Request ไม่ถูกต้อง

404 Not Found
→ Resource ไม่มีอยู่

409 Conflict
→ ขัดกับ Constraint / State

500 Internal Server Error
→ Unexpected server problem
```

ไม่จำเป็นต้องทำครบทุกกรณีใน Milestone 0

---

# 10. Development Environment

Frontend Development:

```text
React / Vite
localhost:5173
```

Backend:

```text
Go
localhost:8080
```

Frontend เรียก API:

```text
/api/products
/api/tenants
/api/reservations
```

ใน Development สามารถใช้ Vite proxy ให้ `/api` ส่งต่อไป Go backend

Concept:

```text
Browser
 ↓
localhost:5173/api/products
 ↓
Vite Proxy
 ↓
localhost:8080/api/products
```

เพื่อให้ Frontend ไม่ต้อง hard-code Backend URL ใน Component

---

# 11. Frontend Structure

V1 ใช้โครงประมาณนี้:

```text
frontend/
│
├── src/
│   ├── api/
│   │   └── client.js
│   │
│   ├── components/
│   │   ├── layout/
│   │   └── ui/
│   │
│   ├── pages/
│   │   ├── DashboardPage.jsx
│   │   ├── TenantsPage.jsx
│   │   ├── ProductsPage.jsx
│   │   ├── ProductDetailPage.jsx
│   │   ├── ReservationsPage.jsx
│   │   └── ReportsPage.jsx
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── package.json
├── vite.config.js
└── index.html
```

ไม่จำเป็นต้องสร้างทุก Folder ตั้งแต่วันแรก

Folder ควรโตตาม Feature ที่ใช้งานจริง

---

# 12. Repository Structure

```text
nexus-crud/
│
├── cmd/
│   └── web/
│       └── main.go
│
├── internal/
│   └── database/
│       └── db.go
│
├── sql/
│   ├── 001_schema.sql
│   └── 002_seed.sql
│
├── frontend/
│   └── React application
│
├── docs/
│   └── NEXUS_CRUD_SHARED_CONTRACT.md
│
├── go.mod
├── README.md
└── .gitignore
```

โครงเดิม:

```text
templates/
static/style.css
```

ไม่ใช้เป็น Frontend หลักอีกต่อไป

React + Tailwind จะอยู่ใน:

```text
frontend/
```

---

# 13. UI Design Principles

## 13.1 Business Question First

ก่อนสร้างทุก Page ต้องตอบให้ได้ว่า:

> ผู้ใช้เข้าหน้านี้เพื่อต้องการรู้อะไรหรือทำอะไร?

ห้ามเพิ่ม Widget เพียงเพราะ “น่าจะสวย”

---

## 13.2 One Primary Purpose Per Page

ตัวอย่าง:

```text
Dashboard
→ ภาพรวม

Products
→ ค้นหาและจัดการ Product

Product Detail
→ เข้าใจ Product หนึ่งตัว

Reservations
→ ดู Reservation Records

Reports
→ ดูข้อมูลสรุป
```

---

## 13.3 List → Detail → Action

Flow หลัก:

```text
List
 ↓
Select Entity
 ↓
Detail
 ↓
Action
```

เช่น:

```text
Products
 ↓
Keyboard
 ↓
Product Detail
 ↓
Edit
```

---

## 13.4 Business Information First

UI ควรเน้น:

```text
Keyboard
Nexus Store
Stock 10
```

มากกว่า:

```text
Product ID = 101
Tenant ID = 1
```

Technical ID ยังแสดงได้ แต่เป็นข้อมูลรอง

---

## 13.5 State Must Be Explicit

State สำคัญต้องเห็นได้ง่าย

เช่น:

```text
RESERVED
COMMITTED
RELEASED
```

Frontend ห้ามสร้าง State ที่ Backend / Data Model ยังไม่มี

---

## 13.6 Loading State

ทุก Page ที่ Fetch API ต้องรองรับ:

```text
Loading...
```

หรือ Loading Skeleton

ห้ามถือว่าข้อมูลจะมาทันทีเสมอ

---

## 13.7 Empty State

ถ้า API ส่ง:

```json
{
  "data": []
}
```

UI ต้องแสดง:

```text
No products yet.

[ Add Product ]
```

ไม่ใช่ Table ว่างโดยไม่มีคำอธิบาย

---

## 13.8 Error State

ถ้า API Error:

```text
Unable to load products.
[ Retry ]
```

UI ต้องไม่ Crash ทั้ง Page

---

## 13.9 Destructive Action

เช่น:

```text
Delete Product
Release Reservation
```

ต้องแยกจาก Action ปกติ

ควรมี Confirmation ก่อน Delete

---

# 14. Tailwind Design Principles

Tailwind ใช้เพื่อสร้าง UI System เดียวกัน ไม่ใช่ใส่ Utility Class แบบสุ่มทุกหน้า

V1 ต้องรักษาความสม่ำเสมอเรื่อง:

```text
Spacing
Typography
Border radius
Table style
Form style
Button style
Status badge
Page width
```

Component ที่ใช้ซ้ำควรถูก Extract เมื่อเกิดการใช้จริง เช่น:

```text
Button
PageHeader
DataTable
StatusBadge
EmptyState
ErrorState
```

แต่ไม่ต้องรีบสร้าง Design System ใหญ่ตั้งแต่ Milestone 0

---

# 15. Visual Direction

Nexus CRUD ควรเป็น:

```text
Clean
Technical
Readable
Database / Inventory oriented
```

ไม่ต้องใช้ Animation เยอะ

Priority:

```text
Information clarity
> Interaction clarity
> Visual decoration
```

Desktop-first ได้สำหรับ V1 แต่ Layout ต้องไม่แตกเมื่อหน้าจอเล็กลง

---

# 16. Navigation

Primary Navigation:

```text
NEXUS INVENTORY

Dashboard
Tenants
Products
Reservations
Reports
```

URL Contract:

```text
/
→ Dashboard

/tenants
→ Tenant List

/tenants/:id
→ Tenant Detail

/products
→ Product List

/products/:id
→ Product Detail

/reservations
→ Reservation List

/reports
→ Reports
```

Frontend routing implementation เลือกได้ตามทีม แต่ URL เหล่านี้ถือเป็น Shared Contract

---

# 17. Dashboard Contract

## Business Question

> ตอนนี้ Inventory มีภาพรวมอย่างไร?

Cards:

```text
Total Tenants
Total Products
Total Stock
Total Reservations
```

ยังไม่แสดง:

```text
Available Stock
Revenue
Redis
Concurrency Metrics
Payment
```

---

# 18. Tenant API Contract

## List Tenants

```text
GET /api/tenants
```

Response:

```json
{
  "data": [
    {
      "tenant_id": 1,
      "tenant_name": "Nexus Store"
    }
  ]
}
```

---

## Get Tenant

```text
GET /api/tenants/{id}
```

---

## Create Tenant

```text
POST /api/tenants
```

Request:

```json
{
  "tenant_name": "Nexus Store"
}
```

---

## Update Tenant

```text
PUT /api/tenants/{id}
```

---

## Delete Tenant

```text
DELETE /api/tenants/{id}
```

---

# 19. Products Page Contract

## Business Question

> ระบบมี Product อะไรบ้าง อยู่ Tenant ไหน และ Stock เท่าไร?

React Page:

```text
ProductsPage.jsx
```

API:

```text
GET /api/products
```

Response Contract:

```json
{
  "data": [
    {
      "product_id": 101,
      "tenant_id": 1,
      "tenant_name": "Nexus Store",
      "sku": "KB001",
      "product_name": "Keyboard",
      "price": 990.00,
      "actual_stock": 10
    }
  ]
}
```

Table:

```text
SKU
Product
Tenant
Price
Stock
Actions
```

Shared Mock:

```text
KB001 | Keyboard   | Nexus Store | 990.00  | 10
MS001 | Mouse      | Nexus Store | 490.00  | 20
CT001 | Controller | Game Store  | 1590.00 | 5
```

---

# 20. Product Create Contract

API:

```text
POST /api/products
```

Request:

```json
{
  "tenant_id": 1,
  "sku": "KB001",
  "product_name": "Keyboard",
  "price": 990.00,
  "actual_stock": 10
}
```

Frontend Form:

```text
Tenant
SKU
Product Name
Price
Stock
```

Validation:

```text
Tenant required
SKU required
Product Name required
Price >= 0
Stock >= 0
```

Frontend validation = UX

Database constraint = Data Integrity Safety Net

---

# 21. Product Detail Contract

Route:

```text
/products/:id
```

API:

```text
GET /api/products/{id}
```

Displays:

```text
Product Name
SKU
Tenant
Price
Stock
Product ID
```

Related Reservations สามารถเพิ่มภายหลังใน Milestone ต่อไป

---

# 22. Reservation List Contract

Frontend:

```text
ReservationsPage.jsx
```

API:

```text
GET /api/reservations
```

Response:

```json
{
  "data": [
    {
      "reservation_id": 1001,
      "product_id": 101,
      "product_name": "Keyboard",
      "tenant_id": 1,
      "tenant_name": "Nexus Store",
      "reserved_qty": 2,
      "status": "RESERVED"
    }
  ]
}
```

UI Columns:

```text
Reservation ID
Product
Tenant
Qty
Status
Actions
```

---

# 23. Reservation V1 Warning

V1 Create Reservation มีไว้เพื่อเรียน:

```text
CRUD
FK
JOIN
State
```

ยังไม่ถือว่า:

```text
Concurrent-safe
Overselling-safe
Production-ready
```

Frontend ไม่ควรใช้ข้อความประเภท:

```text
Guaranteed available
Guaranteed reservation
```

จนกว่า Atomic Reservation จะ Implement แล้ว

---

# 24. Reports Contract

Frontend:

```text
ReportsPage.jsx
```

รายงานเบื้องต้น:

```text
Product Stock Report
Reservation Summary
```

Report API สามารถใช้:

```text
GET /api/reports/product-stock
GET /api/reports/reservations
```

ข้อมูลต้อง derive จาก Source Tables / Database Views

ห้ามสร้าง duplicate Report Table โดยไม่มีเหตุผล

---

# 25. Shared Seed Dataset

## Tenants

```text
1 | Nexus Store
2 | Game Store
```

## Products

```text
101 | 1 | KB001 | Keyboard   | 990.00  | 10
102 | 1 | MS001 | Mouse      | 490.00  | 20
103 | 2 | CT001 | Controller | 1590.00 | 5
```

## Reservations

```text
1001 | 101 | 2 | RESERVED
1002 | 101 | 1 | RESERVED
1003 | 103 | 2 | COMMITTED
```

ทั้ง:

```text
002_seed.sql
```

และ React Mock Data ต้องใช้ Dataset Concept เดียวกัน

---

# 26. Frontend Mock Contract

ก่อน Backend API พร้อม Frontend สามารถใช้:

```javascript
const products = [
  {
    product_id: 101,
    tenant_id: 1,
    tenant_name: "Nexus Store",
    sku: "KB001",
    product_name: "Keyboard",
    price: 990,
    actual_stock: 10,
  },
];
```

เมื่อ API พร้อม:

```text
Mock Data
   ↓ replace
fetch("/api/products")
   ↓
Real API Data
```

Component ไม่ควรต้องออกแบบใหม่ทั้งหมด

---

# 27. API Client Rule

HTTP request ไม่ควรกระจายอยู่ทุก Component

ควรมี Central API Layer เช่น:

```text
frontend/src/api/client.js
```

และอาจมี:

```text
frontend/src/api/products.js
```

Concept:

```text
ProductsPage
     ↓
products API function
     ↓
API client
     ↓
Go Backend
```

เพื่อให้ UI Component ไม่ผูกกับ HTTP details มากเกินไป

---

# 28. React Component Rule

แยก Page กับ Reusable Component

ตัวอย่าง:

```text
ProductsPage
├── PageHeader
├── ProductTable
├── EmptyState
└── ErrorState
```

แต่ใช้หลัก:

> Extract เมื่อมีเหตุผลจากการใช้งานจริง

ไม่สร้าง Component หลายสิบตัวก่อนรู้ว่าต้องใช้หรือไม่

---

# 29. State Ownership

React State เช่น:

```text
loading
products
error
form input
```

เป็น **UI State**

ไม่ใช่ Business Source of Truth

เช่น:

```text
products state
```

เป็น Copy ที่ Frontend ได้จาก Backend เพื่อแสดงผล

Source of stored Product Fact ยังคือ PostgreSQL

---

# 30. Contract Change Rule

ต่อไปนี้เป็น Shared Contract:

- Entity names
- Field names
- Field semantics
- JSON shape
- API endpoint
- HTTP method
- Reservation status
- Frontend route
- Required Page information

ตัวอย่าง Contract Change:

```text
actual_stock
→ stock_qty
```

หรือ:

```text
POST /api/products
→ POST /api/items
```

ห้ามเปลี่ยนเองเงียบ ๆ

ต้อง:

```text
Propose
 ↓
Discuss
 ↓
Update Shared Contract
 ↓
Implement
```

---

# 31. Ownership

## Backend / Database Owner

รับผิดชอบหลัก:

```text
PostgreSQL schema
Constraints
Seed data
Go DB connection
Repository/query layer
REST API
JSON responses
Error mapping
```

อีกคนต้องสามารถ Review Contract ได้

---

## Frontend Owner

รับผิดชอบหลัก:

```text
React structure
Tailwind styling
Pages
Components
Forms
Navigation
Loading / Empty / Error states
API consumption
Frontend interaction
```

อีกคนต้องสามารถ Review Contract ได้

---

# 32. Milestone 0 — Shared Definition of Done

Backend:

```text
PostgreSQL running
       ↓
Schema created
       ↓
Seed products exist
       ↓
Go connects DB
       ↓
GET /api/products works
```

Frontend:

```text
React running
       ↓
ProductsPage exists
       ↓
Tailwind UI works
       ↓
Product Mock matches Contract
```

Integration:

```text
Mock removed
       ↓
React calls GET /api/products
       ↓
Go queries PostgreSQL
       ↓
JSON returned
       ↓
React renders Products
```

Final Flow:

```text
PostgreSQL
     ↓
Go API
     ↓ JSON
React
     ↓
Browser
```

Expected Product List:

```text
SKU     Product      Tenant        Price      Stock

KB001   Keyboard     Nexus Store   990.00     10
MS001   Mouse        Nexus Store   490.00     20
CT001   Controller   Game Store    1590.00    5
```

---

# 33. Milestone 0 Work Split

## Backend Owner

Branch:

```text
feature/database-foundation
```

Tasks:

```text
001_schema.sql
002_seed.sql
PostgreSQL setup
db.go
Go database connection
GET /api/products
```

Goal:

```text
GET /api/products
```

ต้องคืน JSON ตาม Product Contract

---

## Frontend Owner

Branch:

```text
feature/frontend-foundation
```

Tasks:

```text
Create React/Vite frontend
Setup Tailwind CSS
Base layout
Navigation
ProductsPage
Product table
Loading state
Empty state
Error state
Mock Product data
```

Goal:

Product Page ต้อง render Shared Mock Dataset ตาม Product Contract

---

# 34. Milestone 0 Integration Point

ทั้งสองฝั่งต้องมาเจอกันที่:

```text
GET /api/products
```

นี่คือ Boundary สำคัญที่สุด

Backend พูดว่า:

> ฉันรับประกันว่าจะส่ง JSON Shape นี้

Frontend พูดว่า:

> ถ้าได้ JSON Shape นี้ ฉันสามารถ Render ได้

ทั้งสองคนไม่จำเป็นต้องรอ implementation ของอีกฝั่ง

---

# 35. Core Architecture Principle

```text
Database Schema
       ↓
Stored Facts

Go Backend
       ↓
API / Application Boundary

JSON Contract
       ↓
Shared Interface

React
       ↓
UI State + Interaction

Tailwind
       ↓
Visual Presentation
```

Contract อยู่ตรงกลาง:

```text
Backend
   │
   │ JSON Contract
   │
Frontend
```

นี่คือสิ่งที่ทำให้สองคนสามารถพัฒนาแบบ Parallel ได้

---

# 36. Questions Before Adding Anything

ก่อนเพิ่ม Table, API, Page, Field หรือ Component ให้ถาม:

```text
1. Business Question คืออะไร?

2. Fact นี้เป็นของ Entity ไหน?

3. Source of Truth อยู่ที่ไหน?

4. เป็น Stored Fact หรือ Derived Data?

5. Backend หรือ Frontend ควรเป็น Owner ของ Logic นี้?

6. JSON Contract ต้องเปลี่ยนหรือไม่?

7. State Semantics ชัดเจนหรือยัง?

8. Feature นี้อยู่ใน V1 Scope หรือยัง?

9. อีกฝั่งสามารถทำงานต่อได้โดยไม่รู้ Implementation ภายในของเราหรือไม่?
```

ถ้าข้อ 9 ตอบว่า “ได้”

แสดงว่า Boundary/Contract ของเราค่อนข้างดี