# Sari-sari Store POS — client

A store-owner client built with React, TypeScript, Vite, React Router, Tailwind CSS, and Lucide icons. Authentication, dashboard, reports, Settings, products, categories, inventory, cash/utang POS, customers, and sales history connect to Laravel Sanctum APIs. Subscription remains a clickable preview.

## Run locally

From this `frontend` directory:

```sh
npm install
npm run dev
```

Open **http://localhost:3000**. Vite uses strict port `3000`; if it is occupied, stop the existing process before starting this app.

Start the Laravel API at **http://localhost:8000** before signing in. The client defaults to this API URL; copy `.env.example` to a local `.env` only if you need to configure `VITE_API_URL`. Use `localhost` consistently for both apps.

Create an owner account through **Sign up**, or sign in with an existing owner account. Registration creates an account, owner membership, first store, and Free subscription in a database transaction. There is no demo-login bypass. See the backend's `AUTH_SETUP.md` for migration, mail, and session configuration.

## Screens

| Route              | Screen                                         |
| ------------------ | ---------------------------------------------- |
| `/login`           | Store-owner login                              |
| `/signup`          | Owner and store signup                         |
| `/forgot-password` | Request a password reset link                  |
| `/reset-password`  | Reset password using the token/email link      |
| `/dashboard`       | Sales, inventory, and store overview           |
| `/pos`             | Live products, cart, cash checkout and recovery |
| `/products`        | Product list and product forms                 |
| `/categories`      | Product category management                    |
| `/inventory`       | Live stock, adjustments, and movement history  |
| `/sales`           | Sales history and transaction details          |
| `/sales/:saleId/print` | Authenticated printable saved sales summary |
| `/customers`       | Customers, utang balances, cash repayments and ledger |
| `/reports`         | Live sales/collections reports and CSV export   |
| `/subscription`    | Plan comparison and selection preview          |
| `/settings`        | Store and owner settings                       |

`/` opens `/dashboard`; signed-out users are redirected to login. Workspace routes require an authenticated, active owner with an active store. Unrecognized routes show a friendly not-found page.

## Source structure

```text
src/
  App.tsx                    # Small app entry
  api/http.ts                # Credentialed Axios client
  auth/                      # Session provider, guards, services, and forms
  catalog/                   # Catalog API, types and validation
  sales/                     # Sales API, types and shared saved summaries
  dashboard/                 # Dashboard API, exact chart totals and Manila dates
  reports/                   # Report API, date ranges, exact money and CSV
  routes/AppRoutes.tsx       # Lazy-loaded page routes
  layouts/StoreLayout.tsx    # Shared store workspace shell
  components/
    ui/                      # Reusable UI primitives
    layout/                  # Sidebar, header, and workspace dialogs
    auth/                    # Shared auth layout and form components
  pages/
    auth/                    # Separate login, signup, and reset pages
    dashboard/               # Dashboard page and its own components
    pos/, products/, ...     # Feature folders with page-specific components
  config/                    # Navigation configuration
  hooks/                     # Shared UI behavior
  lib/                       # Sample store data and formatting helpers
  index.css                  # Tailwind theme and shared @apply primitives
```

Pages live in their feature folders. Reusable controls and layouts live in `components`; routing stays separate from page content.

## Authentication

Login, registration, logout, session restoration, and password reset use the Laravel API. The browser keeps a protected session cookie; credentials and tokens are not saved in local/session storage. CSRF cookies are established before auth writes. Validation, connection, access, and rate-limit errors are displayed in the forms.

Password-reset email delivery depends on the backend mail configuration. With Laravel's local `MAIL_MAILER=log`, the reset email is written to `api/storage/logs/laravel.log`; configure SMTP to deliver actual email. Keep reset links and application logs private.

## Saved data and feature previews

Products, categories, and inventory are saved to the current store through the API. Their pages support search, filters, pagination, creation/editing, archive/restore, audited stock adjustments, movement history, and filtered CSV export. Global product search and stock reminders also use the saved catalog. New stores start with an empty catalog; no demo products are inserted.

The Free active-product allowance is enforced by Laravel, including restoring archived products. Prices use integer centavos; opening stock and adjustments use whole units. See the backend's `CATALOG_SETUP.md` for payloads, category archive rules, and safe stock retries.

POS uses the saved catalog, barcode lookup, whole-unit cart quantities, cash received/change, and a fixed peso discount. **Review cash sale** opens an order/payment summary before submission. **Back to cart** preserves the order, and only **Confirm & save sale** sends checkout. Cart edits and dialog dismissal are disabled while saving. Laravel validates current price/stock, calculates totals, and saves sales, item snapshots, payments, and stock deductions atomically. Sales history supports search/date filters, pagination, CSV export, and printable/downloadable saved summaries. See the backend's `POS_SETUP.md` for payloads and recovery rules.

An unresolved checkout is retained in sessionStorage for the same user/store and browser tab. The cart stays locked until checking the saved sale or retrying its exact request/key. No credentials are stored there. The app requires an API connection; closing the tab or clearing storage removes local recovery data.

POS defaults to **Cash**. **Utang** shows a searchable name/phone picker and an adjacent Add customer modal; saving selects the new customer while retaining the order. A confirmed full-utang sale deducts stock and adds one audited customer charge, without recording cash collected. New orders return to Cash. Saved summaries and exports distinguish cash from utang. The customers page displays live balances and charge history. See `api/UTANG_SETUP.md` for details.

Customers support partial/full cash repayments with an explicit review step. The ledger records cash received, date, notes, cashier, and before/after balance; the page shows collections separately from sales. Uncertain repayments retain their exact request in per-user/store sessionStorage and expose recovery after closing/reloading the page. See `api/REPAYMENTS_SETUP.md` for balance conflicts and safe retries.

Editable POS drafts now survive navigation/refresh in the same tab, with user/store isolation, current-price/stock refresh before checkout, and confirmation before Clear/New order. Customer maintenance supports contact edits, archive/restore, visible archived debt and repayments, one-time audited opening utang, printable/downloadable statements, and saved repayment acknowledgments. Opening debt creates no sale, cash collection, or stock movement. See `api/CLIENT_COMPLETION_SETUP.md` for policies, routes, recovery, and pilot checks. Cash and Utang remain the only payment choices; GCash and live Subscription are deferred.

Dashboard uses live store totals with Manila business dates, daily sales/transaction charts, top products, recent sale links, stock alerts, and current outstanding utang (including archived debt). Today's cash sales and repayments are separate from sales revenue. The chart/top-products selector supports this week, last week, and this month; cards remain today's figures. Refresh or revisit to load the latest records. See `api/DASHBOARD_SETUP.md` for definitions and endpoint behavior.

Reports use the shared Dashboard calculations for gross sales, discounts, sales after discounts, transactions, units, cash/utang sales, repayments, and cash collected. Today/This week/This month presets and custom ranges use Manila dates (up to 366 days). The interactive chart, top-ten saved product snapshots, and full daily table use actual data. CSV exports the displayed report snapshot with exact money and the applied dates; unapplied date edits disable export. See `api/REPORTS_SETUP.md` for definitions, limits, and verification commands.

Settings now saves store details and owner profile/password with current-password proof for credential changes and revocation of other sessions. POS supports camera barcode decoding using dynamically loaded ZXing, with permission errors/manual fallback and media cleanup. Full-sale void/refund is available in Sales details with explicit review, audited optional restock, pooled-debt adjustment/cash refund, and safe retry/recovery. Historical sales stay intact, and reports/CSV show reversal offsets on their recording dates. See `api/OPERATIONS_SETUP.md` for policy, APIs, migration, and verification.

Down payments at POS, other repayment methods, partial/item refunds, staff invitations, and paid billing remain future work. The admin app remains independent on port `3001`.

## Validate

```sh
npm run build
node --test src/auth/auth.test.mjs src/catalog/catalog.test.mjs src/pages/pos/pos.test.mjs src/pages/pos/draft.test.mjs src/customers/repayments/repayments.test.mjs src/customers/customerOperations.test.mjs src/dashboard/dashboard.test.mjs src/reports/reports.test.mjs src/sales/reversals/reversals.test.mjs src/scanner/scanner.test.mjs
```

The build runs TypeScript checks and produces the static frontend in `dist/`.
