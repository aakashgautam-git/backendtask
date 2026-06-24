# CodeVector Backend Task

A backend service built using **Node.js**, **Express**, **TypeScript**, **Prisma**, and **PostgreSQL** that allows users to browse a large product catalog efficiently.

**Live:** https://backendtask-xj8r.onrender.com/products?limit=5
_(Render free tier — the first request after inactivity may cold-start for ~30–50s.)_

The application supports:

* Browsing 200,000 products
* Newest-first ordering
* Category filtering
* Cursor-based pagination
* Stable pagination while products are inserted or updated
* Efficient querying using database indexes

---

# Tech Stack

* Node.js
* Express.js
* TypeScript
* PostgreSQL
* Prisma ORM
* Faker.js

---

# Project Structure

```text
.
├── prisma
│   ├── migrations
│   ├── schema.prisma
│   └── seed.ts
│
├── src
│   ├── config
│   │   └── prisma.ts          # PrismaClient setup
│   ├── constants
│   │   └── categories.ts
│   ├── controllers
│   │   └── product.controller.ts
│   ├── routes
│   │   └── product.routes.ts
│   ├── services
│   │   └── product.service.ts
│   ├── types
│   │   └── pagination.ts
│   ├── utils
│   │   └── cursor.ts
│   ├── app.ts
│   └── server.ts
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

# Database Design

## Product Model

```prisma
model Product {
  id         BigInt   @id @default(autoincrement())
  name       String
  category   String
  price      Decimal  @db.Decimal(10, 2)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([createdAt(sort: Desc), id(sort: Desc)])
  @@index([category, createdAt(sort: Desc), id(sort: Desc)])
  @@map("products")
}
```

### Why BigInt?

The dataset contains hundreds of thousands of records and may continue growing. Using `BigInt` ensures scalability without running into integer limits.

---

# Pagination Strategy

This project uses **cursor-based pagination** instead of offset-based pagination.

Products are sorted using:

```sql
ORDER BY createdAt DESC, id DESC
```

The cursor contains:

```json
{
  "createdAt": "2026-06-22T18:15:42.000Z",
  "id": "199991"
}
```

and is Base64 encoded before being sent to the client.

Example:

```text
eyJjcmVhdGVkQXQiOiIyMDI2LTA2LTIyVDE4OjE1OjQyLjAwMFoiLCJpZCI6IjE5OTk5MSJ9
```

---

# Why Cursor Pagination?

Offset pagination becomes slower as the dataset grows because the database must skip rows before returning results.

Example:

```sql
SELECT *
FROM products
ORDER BY created_at DESC
LIMIT 20 OFFSET 100000;
```

With cursor pagination:

```sql
WHERE
created_at < cursor.createdAt
OR (
  created_at = cursor.createdAt
  AND id < cursor.id
)
```

PostgreSQL can directly continue from the last record using indexes.

Benefits:

* Faster on large datasets
* Consistent ordering
* No duplicate products
* No missing products
* Works correctly when products are inserted or updated while users are browsing

---

# Handling Data Changes

The assignment requires:

> If new products are added or updated while a user is browsing, they should not see duplicate products or miss products.

This is achieved by:

1. Using a stable, total sort order:
   * `createdAt DESC`
   * `id DESC`
2. Including both fields in the cursor.
3. Using cursor-based queries instead of offsets.

### Why the `id` tiebreaker matters

Many products share the same `createdAt` (the seed deliberately creates colliding timestamps). Ordering on `createdAt` alone would be non-deterministic across those ties and could duplicate or drop rows. Adding `id` makes the order total and stable.

### Inserts vs. updates

* **Inserts:** newly added products receive the newest timestamps, so they only appear ahead of the user's current scroll position — never inside the range already paged. An active session continues correctly and a future session sees the new products at the top.
* **Updates:** ordering is by `createdAt`, which does **not** change when a product is updated. An update therefore cannot move a row across the cursor boundary, so it can't cause a duplicate or a skip.

As a result, users never encounter duplicate or skipped products.

---

# Category Filtering

Products can be filtered using:

```http
GET /products?category=Electronics
```

Supported categories:

* Electronics
* Books
* Fashion
* Sports
* Home
* Beauty
* Toys
* Automotive
* Office
* Kitchen

Invalid categories return a `400 Bad Request` with the list of allowed categories.

---

# Database Indexes

Two indexes are used:

```prisma
@@index([createdAt(sort: Desc), id(sort: Desc)])
@@index([category, createdAt(sort: Desc), id(sort: Desc)])
```

Purpose:

### Index 1

Optimizes:

```http
GET /products
```

### Index 2

Optimizes:

```http
GET /products?category=Electronics
```

Both indexes match the sort and filter exactly, so PostgreSQL can serve ordered, paginated results directly from the index — avoiding full table scans and sorts.

---

# Seeding

The database is populated with **200,000 products**.

Characteristics:

* Batched inserts using `createMany` (not a per-row loop)
* Configurable batch size via `BATCH_SIZE`
* Random product names, categories, and prices
* Many products intentionally share timestamps to simulate real-world data
* Timestamps descend in randomly sized groups so the `id` tiebreaker is genuinely exercised

Run:

```bash
npm run seed
```

---

# Installation

Clone the repository:

```bash
git clone https://github.com/aakashgautam-git/backendtask.git
cd backendtask
```

Install dependencies:

```bash
npm install
```

---

# Environment Variables

Create a `.env` file:

```env
DATABASE_URL="your_postgresql_connection_string"
PORT=3000
BATCH_SIZE=1000
```

Example template:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/products"
PORT=3000
BATCH_SIZE=1000
```

---

# Prisma Setup

Generate Prisma Client:

```bash
npx prisma generate
```

Apply schema:

```bash
npx prisma migrate dev
```

Seed database:

```bash
npm run seed
```

---

# Running the Application

Development mode:

```bash
npm run dev
```

Server starts on:

```text
http://localhost:3000
```

---

# API

## Get Products

```http
GET /products
```

### Query Parameters

| Parameter | Description                                    |
| --------- | ---------------------------------------------- |
| limit     | Number of products to return (default 20, 1–100) |
| cursor    | Cursor returned from the previous page         |
| category  | Filter products by category                    |

---

## Example Requests

First page:

```http
GET /products?limit=10
```

Category filter:

```http
GET /products?category=Electronics
```

Next page:

```http
GET /products?limit=10&cursor=<nextCursor>
```

Category + Pagination:

```http
GET /products?category=Electronics&limit=10&cursor=<nextCursor>
```

---

## Example Response

```json
{
  "data": [
    {
      "id": "200000",
      "name": "Smart Keyboard",
      "category": "Electronics",
      "price": "1999.99",
      "createdAt": "2026-06-22T18:15:42.000Z"
    }
  ],
  "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2LTA2LTIyVDE4OjE1OjQyLjAwMFoiLCJpZCI6IjE5OTk5MSJ9"
}
```

`nextCursor` is `null` on the last page.

---

# Design Decisions

### Why PostgreSQL?

* Reliable relational database
* Strong indexing support
* Excellent performance for large datasets
* Well suited for cursor-based pagination

### Why Prisma?

* Type-safe database access
* Faster development
* Schema-driven workflow
* Easy migrations and seeding

### Why Cursor Pagination?

The task specifically required fast pagination and correct results while data changes. Cursor pagination satisfies both better than offset pagination.

### Why order on `createdAt`, not `updatedAt`?

"Newest first" is about creation order. Ordering on a mutable field like `updatedAt` would let an update reorder a row mid-scroll, breaking the no-duplicate / no-skip guarantee. Ordering on `createdAt` keeps the feed stable.

---

# Future Improvements

Given more time I would add:

* Swagger / OpenAPI documentation
* Automated tests (including the no-duplicate / no-skip guarantee under concurrent writes)
* Wire the shared Prisma client into every module (the service and seed currently instantiate their own)
* Request validation middleware (e.g. zod)
* Caching layer (Redis)
* Health check endpoint
* Docker setup, monitoring, and logging

---

# AI Usage

I used AI to speed up boilerplate and to discuss pagination and indexing strategy, but it made several mistakes I had to find and fix:

* Its generated schema/models didn't match the actual code — fields were defined differently than they were used.
* It produced wrong imports/exports and type mismatches, including string vs `BigInt` handling on the `id`, which broke compilation.

I traced these issues, aligned the Prisma schema with the service and controller code, corrected the import/export structure, and verified the cursor boundary condition and `nextCursor` selection against real data myself. AI was useful for scaffolding and as a sounding board, but the correctness work — making the pieces fit and the pagination provably consistent — was mine.

---

# Author

Aakash Gautam