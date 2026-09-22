# MarketLink Project Presentation Script & Pitch Deck
**Item 09 Submission Document — Complete Slide-by-Slide Defense Guide**
*Competition Category: Digital Economy, Commerce & Business Systems (2026)*

---

## Slide 1: Title & Introduction
- **Project Title**: MarketLink — Empowering Informal Local Commerce Through Real-Time Inventory & Order Management
- **Category**: Digital Economy, Commerce & Business Systems
- **Presenter**: [Your Name]
- **Opening Line**: *"Good afternoon, judges and examiners. Today I am presenting MarketLink, a full-stack multi-vendor commerce platform designed to transition local African service businesses from disorganized WhatsApp chats into formalized, inventory-aware digital commerce."*

---

## Slide 2: The Problem
- **The Reality**: In cities like Abuja and Lagos, tailors, caterers, beauty artists, and repair shops conduct 90%+ of their daily commerce over WhatsApp threads and phone calls.
- **The Friction**:
  1. **Lost Orders**: Messages get lost in private chat threads, resulting in direct revenue loss.
  2. **No Inventory Visibility**: Customers order food or book services that are sold out or overbooked.
  3. **No Auditable Record**: No transaction history, no consolidated revenue reporting, and no order tracking for customers.

---

## Slide 3: Target Users & Personas
1. **The Customer (e.g. Josiah)**: Wants to discover vetted local vendors, order without endless messaging, know prep turnaround times, and track orders in real time.
2. **The Vendor (e.g. Amaka - Amaka's Kitchen)**: Needs a streamlined management console to receive orders, transition order statuses with 1 click, restock inventory, and view weekly revenue.
3. **The Platform Administrator**: Vets and approves merchant applications, enforces quality compliance through suspension, and monitors macro marketplace activity.

---

## Slide 4: The Solution
- **MarketLink** bridges the gap with:
  - **Inventory-Aware Ordering**: Real-time stock counts and visible lead times (*"20 min prep"*, *"Made to order"*).
  - **Deterministic Order State Machine**: A verified server-side pipeline preventing skipped or invalid states.
  - **Role-Based Workflows**: Independent experiences tailored to each user role.

---

## Slide 5: Core System Architecture
- **Three-Tier Architecture**:
  - **Client**: React 19 Single Page Application styled with an editorial dark-mode aesthetic (Fraunces + Inter).
  - **API**: Node.js & Express REST API with strict JWT authentication and role-based middleware (`requireRole`).
  - **Database**: PostgreSQL (Supabase compatible) with connection pooling, foreign keys, and indexes.

---

## Slide 6: Database Design & Concurrency Defense
- **Why PostgreSQL**: Order fulfillment is relational and financial.
- **Key Technical Highlight — Atomic Stock Lock**:
  - When a customer checks out, the backend executes `SELECT ... FOR UPDATE` inside a Postgres transaction.
  - This row-level lock eliminates race conditions: two customers cannot checkout the final available item simultaneously.
- **Unique Review Constraint**:
  - `CONSTRAINT unique_order_customer_review UNIQUE(order_id, customer_id)` prevents review spam or duplicate reviews at the database engine level.

---

## Slide 7: The Order State Machine
- Order transitions are enforced server-side:
  - `pending` → `accepted` → `preparing` → `ready` → `completed`
  - Cancellation allowed from early states with automatic inventory replenishment.
  - Real-time in-app notifications generated at each state transition with 10-second polling synchronization.

---

## Slide 8: Live Demonstration Guide
1. **Browse as Customer**: Show Homepage with Abuja metrics, search by category ("Food"), open Amaka's Kitchen, highlight prep turnaround time ("20 min prep").
2. **Checkout Flow**: Add Jollof Rice to cart, view Cart subtotal, proceed to Checkout, enter delivery address, choose payment method, and place order.
3. **Vendor Console**: Log in as Amaka (`amaka@marketlink.com`), demonstrate the incoming order queue, click **Accept →**, then **Start preparing →**, then **Mark ready →**.
4. **Customer Live Update**: Switch back to Josiah's dashboard (`josiah@marketlink.com`), show the dynamic status badge update without page reload, and submit a 5-star review upon completion.
5. **Admin Console**: Log in as Admin (`admin@marketlink.com`), inspect pending applications (Ngozi's Bake House), and click **Approve**.

---

## Slide 9: Technical Challenges & Lessons Learned
- **Challenge 1: Concurrency during flash sales**: Solved by implementing Postgres row-level locking (`FOR UPDATE`) within an atomic transaction.
- **Challenge 2: Order code collisions**: Solved by catching Postgres unique violation error code `23505` with an automatic retry wrapper.
- **Challenge 3: Auditability vs Deletions**: Decided on non-destructive account suspension rather than hard deletes, keeping historical receipts and invoices intact.

---

## Slide 10: Future Roadmap
- Integration with Nigerian payment gateways (Paystack / Flutterwave live webhooks).
- Dedicated Delivery Rider role with live route optimization.
- Multi-currency support and vendor subscription tiers.

---

## Closing Statement
*"MarketLink demonstrates that formalizing commerce for small businesses does not require complex enterprise software. By prioritizing inventory-aware ordering, atomic transactions, and role-based simplicity, we empower local merchants to grow sustainable digital businesses. Thank you!"*
