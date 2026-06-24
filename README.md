# Product Catalog API

A RESTful API built with **Node.js**, **Express**, **TypeScript**, **Prisma**, and **PostgreSQL** that demonstrates efficient **cursor-based pagination** over a large dataset.

The project seeds **200,000 products** into a PostgreSQL database and exposes an endpoint to retrieve products using stable, scalable cursor pagination.

---

## Features

* Cursor-based pagination
* Stable sorting using `createdAt` and `id`
* Efficient querying with composite database indexes
* PostgreSQL with Prisma ORM
* Express + TypeScript architecture
* Seed script to generate 200,000 products
* Clean separation of routes, controllers, services, and utilities

---

## Tech Stack

* Node.js
* Express
* TypeScript
* Prisma ORM
* PostgreSQL
* Faker.js

---

## Project Structure

```
.
├── prisma
│   ├── schema.prisma
│   └── seed.ts
│
├── src
│   ├── controllers
│   ├── routes
│   ├── services
│   ├── types
│   ├── utils
│   ├── app.ts
│   └── server.ts
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd CodeVectorTask
```

Install dependencies:

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the project root.

```env
DATABASE_URL="postgresql://username:password@localhost:5432/codevector"
```

Replace the credentials with your local PostgreSQL configuration.

---

## Database Setup

Generate the Prisma client:

```bash
npx prisma generate
```

Run the migration:

```bash
npx prisma migrate dev
```

Seed the database:

```bash
npm run seed
```

This inserts approximately **200,000 products** into the database.

---

## Running the Application

Development mode:

```bash
npm run dev
```

The server starts at:

```
http://localhost:3000
```

---

# API

## Get Products

```
GET /products
```

### Query Parameters

| Parameter | Type   | Description                                         |
| --------- | ------ | --------------------------------------------------- |
| limit     | number | Number of records to return (default: 10, max: 100) |
| cursor    | string | Cursor returned from the previous request           |

---

## Example Request

First page:

```
GET /products?limit=5
```

Next page:

```
GET /products?limit=5&cursor=<nextCursor>
```

---

## Example Response

```json
{
  "data": [
    {
      "id": "200000",
      "name": "Laptop",
      "category": "Electronics",
      "price": "49999.99",
      "createdAt": "2026-06-22T18:15:42.000Z"
    }
  ],
  "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2LTA2LTIyVDE4OjE1OjQyLjAwMFoiLCJpZCI6IjE5OTk5NiJ9"
}
```

---

# Pagination Strategy

This project uses **cursor-based pagination** instead of offset-based pagination.

The cursor contains:

* `createdAt`
* `id`

Products are ordered by:

```
ORDER BY createdAt DESC, id DESC
```

When a cursor is supplied, the API returns products that come after the cursor using the following condition:

```
createdAt < cursor.createdAt

OR

(createdAt = cursor.createdAt AND id < cursor.id)
```

This guarantees:

* Stable ordering
* No duplicate records
* No skipped records
* Efficient performance on large datasets

---

# Database Indexes

The following indexes are used to optimize pagination:

```
(createdAt DESC, id DESC)
(category, createdAt DESC, id DESC)
```

These indexes allow PostgreSQL to efficiently retrieve paginated results without scanning the entire table.

---

# Assumptions

* Products are sorted by newest first.
* Product IDs are unique.
* Cursors are Base64-encoded JSON values.
* The API limits page size to a maximum of 100 records.

---

# Future Improvements

* Input validation middleware
* Category filtering
* Authentication and authorization
* Docker support
* API documentation using Swagger/OpenAPI
* Unit and integration tests

---

# Author

Aakash Gautam
