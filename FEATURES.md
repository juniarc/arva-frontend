# Feature Map

This is the full scope of Arva. Every feature is listed here, even ones not built yet. Update the status column when a feature starts or finishes.

Status values: `Not started`, `Design pending` (no Figma frame yet), `In progress`, `Done`, `Parked` (decided to postpone).

## Roles

- **Guest**: can browse, search, and view products and shops. Cannot cart, wishlist, or buy.
- **Buyer**: a logged-in user who can use the cart, wishlist, checkout, and order history.
- **Seller**: a buyer who has created a shop. Can manage their own shop, products, vouchers, and discounts.

A user can be a buyer and a seller at the same time. Sellers can buy from other shops, but a seller cannot buy from their own shop.

## Features

| # | Area | Feature | Who | Status | Design source |
|---|---|---|---|---|---|
| 1 | Auth | Login (username + password) | Guest | In progress | Figma: Login, success and error states |
| 2 | Auth | Sign Up (username, email, password) | Guest | In progress | Figma: Sign Up |
| 3 | Auth | Google login and sign-up | Guest | Parked (UI shows "Coming soon") | Figma: Login, Sign Up |
| 4 | Auth | Forgot password | Guest | Design pending (placeholder route only) | Figma: link on Login |
| 5 | Auth | Log out | Buyer, Seller | Not started | Not in design yet |
| 6 | Layout | Global header (top bar, search, Wishlist, Cart, My Profile) | All | In progress (desktop Cart, My Shop and profile dropdowns; avatar and username in the navbar and mobile menu) | Figma: home navbar |
| 7 | Layout | Footer | All | In progress (home page, dummy content) | Figma: home |
| 8 | Home | Home page with hero, categories, and product sections | Guest | In progress (uses the backend API) | Figma: home |
| 9 | Products | Product list by category | Guest | In progress (/products) | Figma: products |
| 10 | Products | Filters (price, category, and other attributes) | Guest | In progress (/products) | Figma: filter modal |
| 11 | Products | Sort (for example newest, price, best selling) | Guest | In progress (/products) | Figma: sort |
| 12 | Products | Search (products, categories, shops) | Guest | In progress (/search forwards to /products?q=, with matching shops above; no search design yet) | Figma: search results |
| 13 | Products | Product detail (images, variants, stock, price, discount, reviews) | Guest | In progress (uses the backend API) | Figma: product detail |
| 14 | Products | Ratings and reviews | Buyer (write), Guest (read) | Design pending | Figma: review section, rating modal |
| 15 | Shops | Public shop page (shop info, products) | Guest | In progress (/shops/[slug]; the mobile layout is an assumption, the design only has desktop) | Figma: shop page (desktop) |
| 16 | Shops | Create shop | Buyer | In progress (/my-shop/create wizard: step 1 identity and step 2 shop information create the shop; step 3 upload product waits for the product endpoints) | Figma: create shop |
| 17 | Seller | My shop dashboard | Seller | In progress (owner view of /shops/[slug] and /my-shop/edit; product add, edit and delete are disabled "Coming soon") | Figma: my shop |
| 18 | Seller | Manage products (create, edit, status, stock, variants) | Seller | In progress (create: /my-shop/products/new and wizard step 3; edit: /my-shop/products/[id]/edit; delete from the owner's product list) | Figma: upload product, manage product modal |
| 19 | Seller | Tags | Seller | Design pending | Figma: tag modal |
| 20 | Seller | Vouchers and discounts | Seller | Design pending | Figma: voucher section |
| 21 | Cart | Add to cart (with variant and quantity) | Buyer | Design pending | Figma: add to cart modal |
| 22 | Cart | Cart page and cart drawer | Buyer | In progress (cart page at /cart; the drawer already exists) | Figma: cart |
| 23 | Wishlist | Add and remove wishlist items | Buyer | In progress (/wishlist page and removal, and the heart on the product page; cart-row hearts and product cards are not connected yet) | Figma: wishlist |
| 24 | Checkout | Shipment: address and shipping option | Buyer | In progress (/checkout: address, shipping) | Figma: shipment, address, shipping modal |
| 25 | Checkout | Buy now (single product, skips the cart) | Buyer | Design pending | Figma: buy now |
| 26 | Checkout | Vouchers at checkout | Buyer | In progress (/checkout: vouchers modal, backend rules built) | Figma: voucher modal |
| 27 | Checkout | Payment method selection | Buyer | In progress (/checkout: payment method modal) | Figma: payment modal |
| 28 | Checkout | Place order and confirmation | Buyer | In progress (Pay Now creates a paid order with a simulated payment; sold counts go up) | Figma: success modal |
| 29 | Checkout | Payment provider integration | Buyer | Parked (decide after main features) | None |
| 30 | Orders | Order history and order status | Buyer | In progress (/orders: orders with lines by shop, status and details; no design yet) | Figma: order history |
| 31 | Orders | Seller order management | Seller | Not started | Not in design yet |
| 32 | Profile | View and edit profile, address | Buyer | In progress (/profile: info and address sections; photo upload UI is there, its endpoint is not built yet) | Figma: My Profile |

## Build order

1. Auth (features 1, 2, 6)
2. Catalog read-only: home, product list, filters, sort, product detail, shop page (8 to 15)
3. Seller setup: create shop and manage products (16 to 19)
4. Cart and wishlist (21 to 23)
5. Checkout and orders (24 to 28, 30)
6. Reviews, vouchers and discounts, and seller orders (14, 20, 26, 31)
7. Payment provider (29), profile (32), and the rest

Reason for this order: catalog and auth are needed by everything else. Cart and checkout depend on products, variants, and stock. Payments come last because they need the rest to be stable.

## Rule for adding a feature

Before writing code for a feature, it must have:
1. A row in this table with a status.
2. A Figma frame, or a written decision in `DECISIONS.md` that says the design is not needed.
3. Its API endpoints added to `CLAUDE.md` section 7 (or a separate `docs/API.md`).
