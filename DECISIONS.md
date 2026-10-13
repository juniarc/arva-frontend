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

**The products page (`/products`) keeps all its state in the URL.**
Reason: `parseProductsQuery()` (`features/products/query/products-query.ts`) validates every key with zod and drops what is invalid (an unknown category slug is dropped in `page.tsx`, once the category list is loaded). Any filter or sort change goes back to page 1. Refresh, back and shared links work. The page is a Server Component; the results load inside a `<Suspense key>` so the filters stay on screen and a skeleton shows while a new filter loads. A page number past the end redirects to the last page.

**The page size is 12 on every screen size.**
Reason: the server cannot know the screen size, and "page 2" in a shared link must be the same products everywhere. Filtering or slicing on the client is not an option (totals and pages come from the server). 12 fills whole rows in every grid: 2 x 6 (mobile), 3 x 4 (tablet), 4 x 3 (desktop).

**"Most Suitable" sends no `sort`; "Most Popular" sends `sort=popular`.**
Reason: the backend default is `popular`, so the two give the same order. The backend now accepts `sort=relevance` too, but it returns the same order, so nothing is sent until relevance is real.

**The unfiltered product list is cached for 60 seconds; a query with filters, a sort or a search is not.**
Reason: the default list is the same for everyone and is the most visited. A filtered result must never be stale, and the number of possible combinations is large.

**The Location filter sends the stored city value ("Jakarta"), and shows "DKI Jakarta".**
Reason: the backend matches `city` exactly, and the seeded shops have the city "Jakarta". `constants/cities.ts` holds the value and label pairs.

**The wishlist page (`/wishlist`) uses only the real API and lives in the `(site)` route group.**
Reason: like the cart, `page.tsx` is a Server Component that calls `requireUser()`, loads the wishlist with `loadWishlist(token)`, and passes it to the client `WishlistPage`. The unused `(main)/wishlist` placeholder was removed. Removing is one item at a time, behind a confirmation dialog. It is optimistic: the card disappears when the user confirms and comes back at the same position if the request fails. On success the server's full wishlist replaces ours. The error text is fixed ("Wishlist Failed Removed. Please Try Again."); what the server said is never shown.

**The removal dialog keeps the design's reversed buttons: "Delete" is outlined and "Cancel" is filled.**
Reason: Figma shows it that way. Because Cancel looks like the main action, it also gets the initial focus. `components/ui/ConfirmDialog.tsx` is generic (title, labels, loading state); the cart's `ClearConfirmDialog` is not migrated to it because the cart design uses different button styles.

**Add To Cart on the wishlist opens the existing AddToCartModal, and the item stays in the wishlist.**
Reason: adding to the cart is not the same as giving up on a product. Removing it is the user's choice.

**ProductCard has a wishlist mode, switched on by `wishlistState`.**
Reason: without that prop the card is unchanged. With it, the small cart icon is replaced by a heart and a wide "Add To Cart" button (`outOfStock` disables it).

**The heart on the product page is connected to the wishlist API. The cart-row hearts and product cards are not.**
Reason: `PurchaseProvider` calls `addToWishlist(product.id)` or `removeFromWishlist([entryId])` with an optimistic update, a rollback on failure, and a toast. The server tells the page whether the product is already saved (`getWishlistItemId(slug)`, one `GET /wishlist` that runs in parallel with the product load; any failure just leaves the heart empty). The cart-row hearts still only flip local state, and product cards on home and `/products` have no heart.

**The checkout page (`/checkout`) uses only the real API, and only the draft's own address.**
Reason: the draft holds a copy of the address. Saving in the address modal calls `PUT /api/checkout/address` and changes only the draft; checkout never calls a profile endpoint, so no other page's address changes. With no address the row says "Add your address" (and Pay Now stays disabled); with an address it is shown at once and the same modal edits it. Pay Now needs an address, a shipping option and a payment method, and a hint names what is missing.

**The checkout page never calculates money.**
Reason: every amount comes from `draft.summary` and is only formatted ("Rp 1.000"). After each change the whole draft is replaced from the server's answer. A quantity change goes to the cart (`PATCH /cart/items/:id`) and then loads the draft again, because the cart answers with a cart, not a draft. The design's own numbers do not add up (its lines do not sum to Rp 10.000), so none of them were copied.

**Every checkout modal uses `components/ui/ModalShell.tsx`.**
Reason: it is the shared bottom sheet (below 768px) or centered card (from 768px) with focus trap, Escape, focus return and scroll lock. The design draws centered cards on mobile too; the brief asks for a bottom sheet, so a bottom sheet it is. The "order received" modal has no X and ignores clicks outside.

**The cart's Buy button now creates the checkout draft and opens `/checkout`.**
Reason: `buyNow` in `features/cart/api/cart.client.ts` calls `POST /api/checkout`. The cart page also accepts `?notice=checkout_expired`, so the redirect from `/checkout` without a draft can show "Your checkout session has expired. Please select your items again." (known keys only).

**`NEXT_PUBLIC_CHECKOUT_DEV_SUCCESS=true` shows the order-received modal without calling the backend.**
Reason: payments do not exist yet, and the success screen still needs testing. The check includes `NODE_ENV !== "production"`, so the flag does nothing in a production build.

**The address form's regions come from wilayah.id, not from our backend.**
Reason: wilayah.id is a free, static JSON API of Indonesian provinces, regencies, districts and villages, so the backend does not need its own region tables. The browser still only calls our `/api/regions/...` routes; `features/checkout/api/regions.server.ts` fetches from wilayah.id (base URL in `REGIONS_API_BASE_URL`, default `https://wilayah.id`), accepts only well-formed codes, cleans stray spaces in names, and caches each list for a day because the data is static. A region id is its wilayah.id code, for example `31.71.07`, so the backend must treat region ids in the address as text codes, not numbers. Names are sent with the ids, so the address can be shown without another lookup.

**The profile page (`/profile`) saves each section on its own.**
Reason: Profile Info and Address have their own Edit, Cancel and Save, as in the design, and each calls its own endpoint (`PUT /api/profile`, `PUT /api/profile/address`). One Save for both would mix two requests that can fail separately. Only one save runs at a time (the other section waits), so two answers can never cross. Every answer is the full profile and replaces the page's copy. The form exists only in edit mode, so Cancel discards what was typed without any request.

**The profile address is separate from the checkout draft's address.**
Reason: checkout copies the profile address when a draft is created and never writes to the profile; the profile page never calls a checkout endpoint. The profile address has no label, recipient name or phone, which checkout requires, so the backend must fill them when it copies (for example the user's name and phone). Phone formats also differ: the profile allows an optional leading "+" and 8 to 15 digits (as in the design, `+6123123132123`), checkout allows digits only. The profile rule was used here; the backend should strip the "+" when it copies.

**Mobile rows show the label on the left and the value on the right, in both modes.**
Reason: the brief says "label above value" in read mode, but the mobile design draws them side by side. The design wins. In edit mode the address fields are ordered street, province, city, district, sub-district, zip code (so each select can wait for the one above it); read mode keeps the design's order (street, sub-district, district, city, province, zip code). Desktop labels ("State" for the district, "City" for the province) did not match their values, so the region hierarchy is used for both layouts.

**Profile photo: the UI is built, the endpoint is not.**
Reason: `PUT /api/profile/photo` comes in a later backend task. The page checks type (JPG, PNG, WebP) and size (2 MB) before sending, shows a preview, and when the call fails (404 today) it removes the preview and shows "Profile update failed. Please try again." The file goes as multipart, in a field named `photo`.

**The shop page (`/shops/[slug]`) is one page for everyone; the backend decides who is the owner.**
Reason: the page sends the token (if there is one) to `GET /shops/:slug` and shows owner controls only when the answer says `isOwner: true` and carries `ownerDetails`. The mapper also drops `ownerDetails` when `isOwner` is false, so a wrong answer cannot show private data. A token the backend refuses (401) is retried as a guest; the page never redirects to login. The shop's email, phone and address are private: only the owner sees them (backend question: should a contact email or phone ever be public?).

**Shop owner product list, and what is not built.**
Reason: add, edit and delete product, and the create-shop wizard, are separate tasks. "+ Add New Product", "Edit Product" and delete are rendered disabled with the tooltip "Coming soon." (and the same words for screen readers); `/my-shop/create` is a placeholder. The owner list shows no unit after stock and sold, because `manage` has no unit. The owner row shows the category name and variant labels exactly as the backend sends them.

**Public shop mobile layout is an assumption.**
Reason: the design has only desktop for the public page. Mobile and tablet use: back bar, logo and name (then the city), a dark green box with rating and hours side by side, description, products grid (2 columns, 3 on tablet, 4 from 1024px, 8 per page). The owner sections stack under the description on every breakpoint. The shop edit form follows the mobile design (one column, sticky Cancel and Save bar) and two columns from 1024px.

**Shop edit uses Cancel and Save, checkboxes for shipping channels, and HH:MM hours.**
Reason: the design's Back and Next belong to the create wizard; this form edits an existing shop. A shop can ship with several channels, so channels are checkboxes, not radio buttons. Hours are `HH:MM` in the form and in storage ("09:00 - 19:00" on screen); overnight hours are not supported (closing must be later than opening). The zip code is not part of the edit form or its request, so it cannot be changed here.

**Navbar and routes.**
Reason: the desktop header has no "My Shop" link, and the mobile menu's "My Shop" points to `/shop`. The navbar was not changed. `/shop` now redirects to `/my-shop`, and `/my-shop` is in the protected route list. The Pagination component got an optional `hrefFor` prop so the shop page can reuse it with `/shops/[slug]?page=n` links.

**The create-shop wizard (`/my-shop/create`) creates the shop at the end of step 2; step 3 is not built.**
Reason: the design has three steps (Identity Verification, Shop Information, Upload Product), but uploading a product needs product endpoints and image upload that do not exist yet. Step 2's Next calls `POST /api/shops` and step 3 then says "Adding products is coming soon." and links to the new shop. Both steps keep their values when the user goes Back, and a server message about an identity field sends the user back to step 1. A user who already has a shop is sent to it (one shop per user).

**Wizard assumptions that came from no written contract.**
Reason: the IC number (KTP) is checked as exactly 16 digits (the real NIK length; the design's sample has fewer). The agreement checkbox must be checked, and "Terms & Conditions" looks like a link but is plain text because there is no such page. The design's banner "Please complete the requires field." is written "Please complete the required fields." Opening hours start at 09:00 and 17:00. The identity (name, IC number, agreement) is checked in the form but not sent, because the backend's create endpoint rejects fields it does not know; the IC number is never logged or put in browser storage and is cleared from the form after the shop is created. `POST /api/shops` sends only the shop's fields.

**Shop region ids go to the backend as numeric strings.**
Reason: the backend validates them as numeric ("City id must be a numeric string."), while the region lists from wilayah.id use dotted codes. The shop forms remove the dots when sending (`31.71.07` is `317107`) and put them back when loading a saved shop, so the saved regions can be chosen again. The part sizes are fixed (2, 2, 2 and 4 digits), so nothing is lost. The profile and checkout address forms still send the dotted codes.

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
