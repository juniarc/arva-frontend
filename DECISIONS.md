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

**The product page (`/products/[slug]`) uses only the real API. There is no dummy data on it.**
Reason: the backend now returns images, shop details, rating counts, reviews, shop products and recommendations. `features/products/data/product.loader.ts` loads the product plus the two related lists in parallel; the related lists are optional and are left out when empty. Review dates arrive as ISO text and are turned into "1 week ago" on the server (`formatTimeAgo`), so the server and browser render the same text. "View all reviews" shows the 10-review preview; "Load more reviews" fetches the next pages through `/api/products/[slug]/reviews`.

**Product page layout.** One component tree: below 1024px the buying actions live in the Add to Cart modal, opened from a sticky bottom bar (sticky, not fixed, so it never covers the footer); from 1024px the purchase panel is inline. The mobile back arrow sits on the main image, so the global header is unchanged. Buy Now is a stub that shows "Checkout is coming soon."; the wishlist heart only changes the page until the wishlist API exists.

**Alert is one component for success and error messages.** Success is mint with no border; error has a 1px red border. Error text uses `danger-strong` instead of `danger` so it stays readable (AA) on the soft red background.

**The cart page (`/cart`) uses only the real API and lives in the `(site)` route group.**
Reason: `app/(site)/cart/page.tsx` is a Server Component. It calls `requireUser()` (cookie, then `GET /auth/me`; no cookie or a 401 redirects to `/login?redirect=%2Fcart`), loads the cart with `loadCart(token)`, and passes it to the client `CartPage`. The client never fetches the cart on load. Quantity changes and removals go through our own `/api/cart/items` routes; after each success the server's full cart replaces the client's, so totals always come from the backend. The unused `(main)/cart` placeholder was removed.

**Cart items are grouped by `product.shop.slug`.**
Reason: the shop name alone is not unique. The mapper rejects a response without `product.shop`.

**Items are removed with "Clear", or with "-" at quantity 1.**
Reason: the Figma cart has no delete button. Clear removes the selected items after a confirmation. At quantity 1 the "-" button becomes a trash icon (aria-label "Remove item") and removes that one item at once, without a confirmation (requested by the product owner). Both use `DELETE /cart/items`, and nothing changes on screen until the server confirms. Out-of-stock items cannot be selected, so "-" is the way to remove them.

**Nothing is selected when the cart page opens.**
Reason: the design does not say. Selecting nothing avoids buying something by accident. Out-of-stock items cannot be selected.

**On mobile and tablet the cart adds only a slim back bar under the global header.**
Reason: the global header already has search, cart and menu, and the product page also leaves it unchanged. The bottom checkout bar is `sticky` (like the product page's action bar), so it never covers the footer and needs no extra bottom padding.

**The wishlist heart on the cart is UI only.**
Reason: the wishlist API does not exist yet. All heart toggles go through `toggleWishlist()` in `features/cart/wishlist.ts`. Buy is a stub (`buyNow` in `cart.client.ts`) that shows "Checkout is coming soon." until the checkout feature starts.

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
