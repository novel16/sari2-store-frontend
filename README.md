# Sari-sari Store POS — client

The public SaaS website and store-owner client use React, TypeScript, Vite, React Router, Tailwind CSS, and Lucide icons. Laravel supplies the JSON/Sanctum APIs. Public home/pricing use their own layout and frontend HTML renderer; owner routes use the authenticated workspace. Basic purchases support PayMongo QR Ph checkout and verified webhook fulfillment, alongside existing administrator grants.

## Run locally

From this `frontend` directory:

```sh
npm install
npm run dev
```

Open **http://localhost:3000**. Vite uses strict port `3000`; if it is occupied, stop the existing process before starting this app.

Start the Laravel API before opening the site. Configure `VITE_API_URL` in your local `.env` to its published host origin: this workstation's Sail setup uses **http://localhost:80**, while the non-Docker fallback is port 8000. Use `localhost` consistently for both apps. The public website migration and full SEO/deployment setup are documented in [WEBSITE_SETUP.md](../api/WEBSITE_SETUP.md).

Create an owner account through **Sign up**, or sign in with an existing owner account. Registration creates an account, owner membership, first store, and Free subscription in a database transaction. There is no demo-login bypass. See the backend's `AUTH_SETUP.md` for migration, mail, and session configuration.

## Screens

| Route                  | Screen                                                |
| ---------------------- | ----------------------------------------------------- |
| `/`                   | Public SaaS home with rendered SEO HTML                |
| `/pricing`             | Public current plan comparison                         |
| `/website-preview`     | Saved website draft preview for administrators         |
| `/login`               | Store-owner login                                     |
| `/signup`              | Owner and store signup                                |
| `/forgot-password`     | Request a password reset link                         |
| `/reset-password`      | Reset password using the token/email link             |
| `/dashboard`           | Sales, inventory, and store overview                  |
| `/pos`                 | Live products, cart, cash checkout and recovery       |
| `/products`            | Product list and product forms                        |
| `/categories`          | Product category management                           |
| `/inventory`           | Live stock, adjustments, and movement history         |
| `/sales`               | Sales history and transaction details                 |
| `/sales/:saleId/print` | Authenticated printable saved sales summary           |
| `/customers`           | Customers, utang balances, cash repayments and ledger |
| `/reports`             | Live sales/collections reports and CSV export         |
| `/subscription`        | Live plan comparison, current terms, and usage        |
| `/subscription/checkout?plan=basic` | Duration and payment summary; proceeds directly to PayMongo |
| `/subscription/payments/:orderId` | Payment status, resume, cancellation, and activation |
| `/settings`            | Store and owner settings                              |

`/` is public, including for signed-in visitors, and does not request `/me`. Workspace routes require an authenticated, active owner with an active store. Public navigation uses real links; choosing Basic preserves plan intent through signup/login to subscription checkout. Unrecognized production routes return a not-found page with HTTP 404.

Subscription purchases use a checkout page with an editable 1–12 month duration and live total. Proceed creates the order once and redirects in the same tab when its trusted PayMongo checkout URL is ready. Returns and payment-history links open the order status page without automatically reopening checkout. Uncertain requests retain the original recovery key; older `/subscription?order=...` return links remain supported. Plan details expand inline.

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
  subscriptions/             # Live plan types, allowance labels and usage helpers
  routes/AppRoutes.tsx       # Lazy-loaded page routes
  layouts/PublicLayout.tsx   # Public website navigation and footer
  layouts/StoreLayout.tsx    # Shared store workspace shell
  website/                   # Public pages, SEO, hydration and React server entry
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

Editable POS drafts now survive navigation/refresh in the same tab, with user/store isolation, current-price/stock refresh before checkout, and confirmation before Clear/New order. Customer maintenance supports contact edits, archive/restore, visible archived debt and repayments, one-time audited opening utang, printable/downloadable statements, and saved repayment acknowledgments. Opening debt creates no sale, cash collection, or stock movement. See `api/CLIENT_COMPLETION_SETUP.md` for policies, routes, recovery, and pilot checks. Cash and Utang remain the only POS payment choices; GCash and automatic billing are deferred. Plan comparison and usage read the saved catalog and effective subscription. Owners can see paid expiry, next scheduled terms, manual renewal instructions, and Free fallback after expiry; see `api/PLANS_SETUP.md` and `api/SUBSCRIPTIONS_SETUP.md`.

Dashboard uses live store totals with Manila business dates, daily sales/transaction charts, top products, recent sale links, stock alerts, and current outstanding utang (including archived debt). Today's cash sales and repayments are separate from sales revenue. The chart/top-products selector supports this week, last week, and this month; cards remain today's figures. Refresh or revisit to load the latest records. See `api/DASHBOARD_SETUP.md` for definitions and endpoint behavior.

Reports use the shared Dashboard calculations for gross sales, discounts, sales after discounts, transactions, units, cash/utang sales, repayments, and cash collected. Today/This week/This month presets and custom ranges use Manila dates (up to 366 days). The interactive chart, top-ten saved product snapshots, and full daily table use actual data. CSV exports the displayed report snapshot with exact money and the applied dates; unapplied date edits disable export. See `api/REPORTS_SETUP.md` for definitions, limits, and verification commands.

Settings now saves store details and owner profile/password with current-password proof for credential changes and revocation of other sessions. POS supports camera barcode decoding using dynamically loaded ZXing, with permission errors/manual fallback and media cleanup. Full-sale void/refund is available in Sales details with explicit review, audited optional restock, pooled-debt adjustment/cash refund, and safe retry/recovery. Historical sales stay intact, and reports/CSV show reversal offsets on their recording dates. See `api/OPERATIONS_SETUP.md` for policy, APIs, migration, and verification.

Down payments at POS, other repayment methods, partial/item refunds, and staff invitations remain future work. The admin app remains independent on port `3001`.

## Validate

```sh
npm test
npm run lint
npm run build
```

`npm test` discovers every `*.test.mjs` suite, including subscription and recovery tests. The build runs strict TypeScript checks and produces browser assets/public snapshots in `dist/` and the public React renderer in `dist-server/`. Production uses `npm start` (Node 24) to serve fresh published HTML, sitemap, robots, assets, and the private SPA shell. Configure `SITE_URL` and `SEO_INDEXABLE` for the real HTTPS production domain; local/staging indexing is off by default. A static SPA fallback alone does not provide this publication flow. See [website serving and SEO](../api/WEBSITE_SETUP.md). On an 8 GB development machine, run `node --test --test-concurrency=1`, lint, and build sequentially, one app at a time. Lazy pages have a recovery screen with page reload and dashboard actions if loading or rendering fails.

Stock adjustments retain uncertain requests across modal close, page navigation and reload in the same tab. A pending adjustment blocks another adjustment until its original request is confirmed. Mounted React tests simulate a committed write with a lost response, retries, navigation, CSRF errors and inaccessible storage. Product units are chosen at creation and fixed when editing to preserve inventory history; see `api/CATALOG_SETUP.md`.

Cash closing is available at `/cash-closing` in the sidebar. Owners can review opening cash, record reviewed manual cash-in/out, compare the server's expected cash against a physical count, and confirm one final closing per Manila business day. History, manual-movement pagination and closing CSV downloads use saved records. Uncertain cash operations retain their exact request across navigation/reload; a changed activity snapshot requires a fresh closing review. Final closings cannot be reopened, and block further cash transactions for that date. See `api/CASH_CLOSING_SETUP.md` for policies, APIs and migration details.
