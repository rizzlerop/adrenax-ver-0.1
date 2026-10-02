# ADRENAX Store

A Next.js App Router storefront with a Supabase-backed product catalog and a private inventory portal.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable key.
3. If the tables do not exist, run `supabase/schema.sql`, then `supabase/policies.sql` in the Supabase SQL editor. Review existing project policies before applying changes.
4. Run `supabase/registration.sql` to assign every new sign-up the standard web-user role (`is_admin = false`).
5. Create a public Storage bucket named `product-images` so product image URLs can be displayed. The storage object policies are in `supabase/policies.sql`.
6. Create admin users through Supabase Auth, then set `is_admin = true` only for authorized user IDs in `user_roles`.
7. Start the app with `npm run dev`.

Use Node.js 20.9 or newer.

The schema expected by the app is `categories (id, name, created_at)`, `products (id, name, description, price, stock_quantity, image_url, category_id, is_deleted, created_at)`, and `user_roles (id, is_admin)`. The storage bucket name is `product-images`.

Public catalog reads exclude soft-deleted products. Anyone can register a standard storefront account; a database trigger assigns new accounts `is_admin = false`, and clients cannot change that role. Admin pages re-check the signed-in user and the `user_roles` row on the server, and mutations repeat that authorization check. Supabase RLS policies are also included because route checks do not replace database authorization.

The cart is stored in the visitor's browser. The requested schema has no orders or payment provider, so checkout is presented as a summary and is not an order submission flow.
