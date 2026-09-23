# MarketLink — Full Stack Multi-Vendor Commerce Platform
**Digital Economy, Commerce & Business Systems Innovation Project 2026**
*Code Campus Final NodeJS Project*

---

## Project Documentation 
[Project Documentation](https://josiah10g.github.io/Market-Link/)

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

- **Frontend**: React 19, React Router v7, Axios with JWT interceptors, Lucide icons, Custom Vanilla CSS Design System with dark mode tokens (`#0B0F0E`, `#121816`, `#B9FF66`).
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


---
## 4. Problem & Why It Matters
Small vendors (tailors, salons, food sellers) rely on WhatsApp/phone calls for orders, leading to missed orders, no inventory tracking, and no order history. This causes lost revenue and poor customer experience.

## 5. Target Users & Roles

**Customer** — browses vendors, places orders/bookings, tracks order status, pays
**Vendor** — manages storefront, products/services, inventory, incoming orders
**Admin** — approves vendors, monitors platform activity, resolves disputes

## 6. Core user journey
Customer registers → browses vendor storefronts → adds to cart/books slot → checks out → vendor receives order → vendor updates status (accepted/preparing/ready/completed) → customer gets notified → order archived in history.

## 7. Major features / workflows
Vendor onboarding & approval, product/service catalog with inventory, cart & checkout, order status pipeline, vendor dashboard with analytics, review/rating system.

## 8. Main entities
User, Vendor, Product/Service, Order, OrderItem, Category, Review, Payment, Notification.

## 9. What makes it different
Inventory-aware ordering (not just a listing site) + role-based dashboards + real order lifecycle instead of a single "contact seller" button.

## 10. Future growth
delivery-rider role, subscription plans for vendors, AI-based product recommendations, multi-currency support.



---


