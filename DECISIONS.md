# Decisions Log

Record every product, design, or technical decision here. Newest entries go at the top. Each entry has a date, the decision, and the reason.

## 2026-10-12

**Auth pages follow the Figma design, not the old repo.**
The old repo used email login and had a phone number on sign-up. The Figma design uses username login and has no phone field. We follow Figma.
Reason: Figma is the agreed design. The phone field can be added later if needed.

**Login uses username and password.**
Reason: matches the design ("Enter your username").

**Sign Up has username, email, password, and confirm password.**
Reason: matches the design.

**Routes are /login and /signup.**
Reason: the design says "Sign Up" and the old middleware used /signup. The old /register route is not used.

**Google login and sign-up are UI only.**
Reason: no OAuth backend yet. Buttons show "Coming soon."

**Tokens are stored in httpOnly cookies set by Next.js route handlers.**
Reason: prevents JavaScript from reading the token, which reduces the impact of XSS.

**Frontend uses react-hook-form and zod. Old repo's Formik and Yup are not used.**
Reason: one validation approach shared by client and server.

**Monorepo with apps/web and apps/api. npm workspaces.**
Reason: one repository for both apps, so both devices always have matching versions of the API contract.

**Forgot Password page is a placeholder route.**
Reason: the link appears in the design, but the feature is out of scope for this task.

**Scope is the full marketplace. Auth is the first feature, not the whole project.**
Reason: Arva includes catalog, shops, seller tools, cart, wishlist, checkout, and orders. The full list is in `docs/FEATURES.md`, and features are built in the order given there.

**Three roles: guest, buyer, seller.**
Reason: a seller can also buy. Sellers cannot buy from their own shop.

**One shop per user (provisional).**
Reason: keeps the seller model simple for a bootcamp project. Confirm with the product owner before building create-shop.

**Cart and wishlist require login. Guests can browse only.**
Reason: cart and wishlist are stored per user on the backend. Guest carts are not part of the scope.

**Build order: auth, catalog, seller setup, cart and wishlist, checkout and orders, then reviews, vouchers, and payments.**
Reason: each step depends on the one before it. Payments come last because they need stable orders and stock.

**Cart items do not reserve stock. Stock is checked at checkout.**
Reason: simpler and common in marketplaces. Re-check stock when the order is placed, and reject orders that can't be fulfilled.

**Home, categories, product detail and cart come from the backend API. There is no dummy data left.**
Reason: the backend now has these endpoints. Server code reads them through `features/products/api/catalog.server.ts` and `features/cart/api/cart.server.ts`; responses are parsed with zod. The browser only talks to our own `/api/products/[slug]` and `/api/cart` routes, so the token stays in the httpOnly cookie. Category icons come from the API's `iconKey` (see `features/products/data/categories.ts`). Desktop-only sections are hidden below 1024px with `DesktopOnly` / `BelowDesktop`.

**The product card opens an Add to Cart modal that loads the variants from `GET /products/:slug`.**
Reason: card data (`GET /home`) has no variants. The modal is a native `<dialog>` (bottom sheet below 768px, centered card from 768px). Guests are sent to `/login?redirect=<current path>`; the login state comes from `isLoggedIn()` in `lib/session.ts` (cookie presence only). After adding, the page refreshes so the header cart badge and drawer update.

**The product page (`/products/[slug]`) uses the real API where it can. Reviews are sample data.**
Reason: `GET /products/:slug` gives the product, description and variants, and `GET /products` gives related products. There is no reviews endpoint and no shop details (rating, logo) yet, so reviews come from `features/products/data/dummy-reviews.ts` and the shop card only shows name and city. "Products from this shop" filters the popular list by shop name, because the list has no shop filter. The shop slug is made from the shop name (`slugify`) until the API returns one.

**Product page layout.** One component tree: below 1024px the buying actions live in the Add to Cart modal, opened from a sticky bottom bar (sticky, not fixed, so it never covers the footer); from 1024px the purchase panel is inline. The mobile back arrow sits on the main image, so the global header is unchanged. Buy Now is a stub that shows "Checkout is coming soon."; the wishlist heart only changes the page until the wishlist API exists.

**Alert is one component for success and error messages.** Success is mint with no border; error has a 1px red border. Error text uses `danger-strong` instead of `danger` so it stays readable (AA) on the soft red background.

## Open questions

- Payments provider (decide after the main features are done).
- Whether the phone number is needed at sign-up.
- Whether login should also accept email.
- Exact font family for headings (confirm in Figma).
- Whether one user can own more than one shop.
- Whether guests can keep a cart before logging in.
- Who creates vouchers: sellers only, the platform only, or both.
- Whether cart is grouped by shop at checkout, or one order per shop.
- How stock is handled for variants that sell out during checkout.
