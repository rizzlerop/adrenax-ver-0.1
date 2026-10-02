# ADRENAX Store

A Next.js App Router storefront with a Supabase-backed product catalog and a private inventory portal.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable key.
3. If the tables do not exist, run `supabase/schema.sql`, then `supabase/policies.sql` in the Supabase SQL editor. Review existing project policies before applying changes.
4. Run `supabase/registration.sql` to assign every new sign-up the standard web-user role (`is_admin = false`).
5. Create a public Storage bucket named `product-images` so product image URLs can be displayed. The storage object policies are in `supabase/policies.sql`.
6. Create admin users through Supabase Auth, then set `is_admin = true` only for authorized user IDs in `user_roles`.
7. For payment checkout, apply `supabase/payments.sql` after reviewing it. Add the server-only Supabase service key and Razorpay **Test Mode** credentials from `.env.example` to `.env.local` and Vercel. Never use live keys for the initial checkout test.
8. In the Razorpay Test Mode dashboard, configure a webhook pointing to `https://<your-deployed-domain>/api/webhooks/razorpay`, subscribe to `payment.captured`, and set the same webhook secret as `RAZORPAY_WEBHOOK_SECRET`.
9. Start the app with `npm run dev`.

Use Node.js 20.9 or newer.

The base schema expected by the app is `categories (id, name, created_at)`, `products (id, name, description, price, stock_quantity, image_url, category_id, is_deleted, created_at)`, and `user_roles (id, is_admin)`. Payment checkout adds `orders` and `order_items` through `supabase/payments.sql`. The storage bucket name is `product-images`.

Public catalog reads exclude soft-deleted products. Anyone can register a standard storefront account; a database trigger assigns new accounts `is_admin = false`, and clients cannot change that role. Admin pages re-check the signed-in user and the `user_roles` row on the server, and mutations repeat that authorization check. Supabase RLS policies are also included because route checks do not replace database authorization.

The cart is stored in each visitor's browser. Razorpay orders are created server-side from current Supabase product prices, and customer orders are stored with row-level security. Checkout verifies Razorpay's payment signature and a captured payment before marking an order paid and decrementing inventory. Shipping is collected for delivery, but shipping charges are not configured yet; the initial test checkout charges the product subtotal only. Set a shipping policy before switching to live payment keys.
