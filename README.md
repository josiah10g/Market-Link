# MarketLink — Full Stack Multi-Vendor Commerce Platform
**Digital Economy, Commerce & Business Systems Innovation Project 2026**
*Code Campus International Evaluation Submission*

---

## 1. Project Overview & Problem Statement

### The Problem
Local service businesses in developing markets (such as caterers, bespoke fashion tailors, beauty salons, and smartphone repairers) rely overwhelmingly on unorganized WhatsApp threads, Instagram DMs, and direct voice calls for daily transactions. This causes:
- **Severe Order Loss**: Messages get buried in active personal chats, leading to lost customer revenue.
- **Zero Real-Time Inventory Control**: Customers order items or request time slots that are unavailable or out of stock, causing customer friction.
- **Absence of Order Lifecycles & Audit Trails**: Customers cannot track order status (prep, dispatch, ready), and merchants have no consolidated revenue analytics or transaction records.

### The MarketLink Solution
MarketLink formalizes informal local commerce without forcing vendors to adopt complex enterprise ERPs. It provides:
1. **Inventory-Aware Ordering**: Real-time stock locks prevent race conditions, and lead times (*"20 min prep"*, *"Made to order (3 days)"*) set clear customer expectations.
2. **Deterministic Order State Machine**: An enforced server-side pipeline (`pending` → `accepted` → `in_progress` → `ready` → `completed` | `cancelled`).
3. **Dedicated Role-Based Experiences**: 
   - **Customer**: Browsing, single-vendor cart enforcement, atomic checkout, live order tracking, and verified reviews.
   - **Vendor**: Separate management console with real-time revenue analytics, incoming order queue with 1-click status transitions, and low-stock alerts.
   - **Admin**: Independent verification console to review pending vendor applications and enforce compliance via suspension controls.

---

## 2. Tech Stack

- **Frontend**: React 19, React Router v7, Context API (Auth + Cart), Axios with JWT interceptors, Lucide icons, Custom Vanilla CSS Design System with dark mode tokens (`#0B0F0E`, `#121816`, `#B9FF66`).
- **Typography**: Fraunces (editorial serif headings) + Inter (sans-serif body/UI).
- **Backend**: Node.js, Express, PostgreSQL / Supabase, `pg` (Connection Pooling & SSL), `jsonwebtoken`, `bcryptjs`, `express-validator`, `morgan`.
- **Architecture**: RESTful API with Role-Based Access Control (RBAC), Row-Level Transaction Locks (`SELECT ... FOR UPDATE`), and database-enforced unique constraints.

---

## 3. Database Design & Relational Schema (PostgreSQL / Supabase)

The platform is designed with a strict relational schema:
- **`users`**: Customer, Vendor, and Admin accounts with hashed passwords (`bcryptjs`).
- **`vendors`**: Storefront profiles linked to `users.id`, with categories, ratings, and approval statuses (`pending`, `approved`, `suspended`).
- **`products`**: Catalog items with foreign key to `vendors.id`, pricing, inventory stock counters, and lead times.
- **`orders`**: Transaction records with generated `#ML-XXXX` unique human-readable codes, customer reference, vendor reference, payment status, and order status state machine.
- **`order_items`**: Relational breakdown of ordered items, snapshot prices, and quantities.
- **`reviews`**: Verified customer ratings (1–5) and comments, strictly restricted to completed orders with a database-level unique constraint (`CONSTRAINT unique_order_customer_review UNIQUE(order_id, customer_id)`).
- **`notifications`**: In-app alert queue with polling support, dispatching real-time notifications on order status transitions.

### Key Indexes Created
- `CREATE UNIQUE INDEX idx_users_email ON users(email);`
- `CREATE INDEX idx_vendors_user_id ON vendors(user_id);`
- `CREATE INDEX idx_products_vendor_id ON products(vendor_id);`
- `CREATE INDEX idx_orders_customer_id ON orders(customer_id);`
- `CREATE INDEX idx_orders_vendor_id ON orders(vendor_id);`
- `CREATE INDEX idx_orders_status ON orders(status);`

---

## 4. Local Setup & Running Instructions

### Prerequisites
- Node.js (v18+) and npm
- PostgreSQL database (Local or Cloud Supabase instance)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Configure your environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - In `.env`, add your Supabase / PostgreSQL connection string:
     ```env
     PORT=5000
     DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres
     JWT_SECRET=marketlink_super_secret_jwt_key_2026_dev_secure
     CLIENT_URL=http://localhost:5173
     ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run table migrations and seed demo data:
   ```bash
   npm run migrate
   npm run seed
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The API will start at `http://localhost:5000`.*

### Frontend Setup
1. Open a second terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The client will start at `http://localhost:5173`.*

---

## 5. Demo Evaluation Credentials (For Evaluator & Marker Use Only)

The seed script (`npm run seed`) populates realistic demo accounts and pre-existing Abuja commerce data:

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin** | `admin@marketlink.com` | `admin123` | Platform console, approve/reject vendors |
| **Vendor** | `amaka@marketlink.com` | `password123` | Amaka's Kitchen (Food & Catering, incoming orders) |
| **Vendor** | `tunde@marketlink.com` | `password123` | Tunde Bespoke Tailors (Fashion & Suits) |
| **Customer** | `josiah@marketlink.com` | `password123` | "Hey Josiah" active order tracker & reviews |

---

## 6. Key Technical Innovations Defended

1. **Race-Condition Free Checkout (`SELECT ... FOR UPDATE`)**:
   During order placement, a Postgres transaction acquires an exclusive row-level lock on each item's stock counter. If another customer attempts to checkout the last available item concurrently, one succeeds while the second fails cleanly without creating partial ghost orders.
2. **Order Code Collision Retry Loop (Error 23505)**:
   The backend generates human-readable order codes (`#ML-XXXX`). If a collision occurs against the unique constraint, the controller automatically catches Postgres error code `23505` and regenerates a fresh code without interrupting checkout.
3. **Enforced State Machine Transitions**:
   Invalid status hops (e.g. attempting to jump from `pending` directly to `completed`) are blocked server-side with `400 Bad Request`. Allowed paths:
   - `pending` → `accepted` | `cancelled`
   - `accepted` → `preparing` | `cancelled`
   - `preparing` → `ready` | `cancelled`
   - `ready` → `completed`
4. **Transparent Controller-Side Rating Recompute**:
   Upon review submission, vendor ratings and counts are recomputed atomically in the controller (`ROUND(AVG(rating), 1)`), immediately reflecting in the UI.
5. **Non-Destructive Compliance Audit Trail**:
   Vendors and users are suspended rather than hard-deleted, preserving order history, invoice numbers, and relational integrity (`ON DELETE RESTRICT`).
