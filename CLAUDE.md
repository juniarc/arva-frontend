# Arva: Project Context and Rules

This file is read by AI coding assistants at the start of every session. Keep it accurate. If a decision changes, update this file and `docs/DECISIONS.md` in the same commit.

## 1. What we are building

Arva is a marketplace website. Users can register, log in, create a shop, list products, add products to a cart and wishlist, and check out. Products are sold by many shops, so there are two kinds of users: buyers and sellers. A user can be both.

The UI is based on the Figma file "Arva". Figma is the source of truth for visual design. If the code and Figma disagree, change the code, unless a decision in `docs/DECISIONS.md` says otherwise.

The full feature list, with status and build order, is in `docs/FEATURES.md`. Read it before starting any task. Only build a feature whose status allows it, and follow the build order.

Current focus: authentication (Login, Sign Up) and the global header. Other features are listed in `docs/FEATURES.md` but are not started yet, so do not build them unless the task asks for them.

## 1a. Roles

- **Guest**: browses, searches, views products and shops. Cannot cart, wishlist, or buy.
- **Buyer**: logged in. Can use cart, wishlist, checkout, and order history.
- **Seller**: a buyer who has created a shop. Manages their own shop, products, vouchers, and discounts.

A user can be both a buyer and a seller. A seller cannot buy from their own shop.

## 1b. Domain glossary

Use these words in code, database names, and UI text. Do not use synonyms.

- **Product**: an item a shop sells. Has images, description, category, tags, shipping cost, and one or more variants.
- **Variant**: a sellable version of a product (for example size or weight), with its own price, stock, and unit.
- **Shop**: a seller's store. Belongs to one user. A user has at most one shop (confirm in DECISIONS.md if this changes).
- **Category**: a product group used for navigation and filters.
- **Tag**: a seller-defined label on products, used for grouping.
- **Discount**: a price reduction on a product, with a type, value, and date range.
- **Voucher**: a code a buyer can apply at checkout, created by a seller or the platform.
- **Cart**: the buyer's pending items, grouped by shop. Items are not reserved stock.
- **Wishlist**: products a buyer saved for later.
- **Order**: a confirmed purchase, created from cart items or a buy-now action. Grouped by shop.
- **Shipment**: the delivery address and shipping option for an order.
- **Buy now**: a checkout for one product that skips the cart.

## 2. Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router), React 18, TypeScript (strict) |
| Styling | Tailwind CSS with theme tokens |
| Forms | react-hook-form + zod |
| Backend | Node.js + Express, TypeScript |
| Database | PostgreSQL with Prisma |
| Payments | Not decided yet. Do not add a payment provider without asking. |
| Package manager | npm only. Do not commit `yarn.lock` or `pnpm-lock.yaml`. |

The old repo (`juniarc/arva-gfp-frontend`) used Formik, Yup, Material Tailwind, Flowbite, and a hosted backend. We are not using those in the new project. Do not copy code from the old repo without reviewing it first.

## 3. Repository layout

This is a monorepo with two apps:

```
arva/
  apps/
    web/          # Next.js frontend
    api/          # Express backend
  docs/
    ARCHITECTURE.md
    CONVENTIONS.md
    DECISIONS.md
  CLAUDE.md
  README.md
```

Frontend folder structure is described in `docs/ARCHITECTURE.md`. Do not invent new top-level folders without updating that file.

## 4. Commands

Run these from the app folder. Do not guess other commands.

- `npm install`: install dependencies
- `npm run dev`: start the dev server
- `npm run build`: production build (must pass before a task is done)
- `npm run lint`: lint
- `npm run typecheck`: TypeScript check with no emit
- `npm test`: unit and component tests

Before saying a task is done, run `typecheck`, `lint`, and `test`, and report the results.

## 5. Non-negotiable rules

Security
- Auth tokens live only in httpOnly, secure (in production), sameSite "lax" cookies. Never use localStorage or sessionStorage for auth data.
- Never store the user id in a separate cookie. Fetch the current user from the backend with the token.
- Never log passwords, tokens, or full form payloads.
- Validate all input on the server, even if the client already validated it.
- Redirect targets after login must be relative paths. Reject anything that is not a path starting with "/" and not "//".
- Secrets come from environment variables. Never commit `.env`. Commit `.env.example` only.

Architecture
- Components do not call `fetch` directly. Use the typed API client in `lib/api`.
- Business logic (pricing, stock, discounts, order rules) lives in the backend service layer, not in React components.
- Keep Server Components by default. Add `"use client"` only when the component needs state, effects, or event handlers.
- Reuse UI primitives from `components/ui`. Do not copy styles between components.
- Do not hard-code hex colors or spacing in components. Use Tailwind theme tokens.

Code quality
- TypeScript strict mode. Do not use `any`. Use `unknown` and narrow it, or write a proper type.
- Define each zod schema once and reuse it on both client and server.
- Name files by their role: `LoginForm.tsx`, `login.schema.ts`, `auth.ts`.
- Keep functions small and pure where possible. Test the logic that matters most.
- Do not leave `console.log` in committed code. Use the logger in `lib/logger.ts`.
- Do not leave commented-out code in committed files.

Scope
- Do one task at a time. If a task touches more than one feature, split it.
- If the design, the spec, and this file disagree, stop and ask. Do not guess.
- Do not add dependencies without a reason written in the commit message.

## 6. Current decisions (summary)

Full history is in `docs/DECISIONS.md`. Decisions below apply to the auth feature. Marketplace-wide decisions are also recorded there.

- Login uses **username and password**, not email.
- Sign Up fields: **username, email, password, confirm password**. No phone number in the current design.
- Login and Sign Up routes are **/login** and **/signup**.
- Google login and sign-up buttons are **UI only** for now and show "Coming soon."
- The global header appears on all auth pages and is a shared component.

## 7. API contract

Endpoints for each feature are added here when the feature starts. If a feature has no endpoints listed, its contract is not decided yet, so ask before writing frontend code that calls it.

Auth (in use now):

- `POST /auth/register`
  - Body: `{ username, email, password }`
  - 201: `{ user_id, username, email }`
  - 409: `{ message }` when the username or email is already taken
- `POST /auth/login`
  - Body: `{ username, password }`
  - 200: `{ access_token, user: { user_id, username, email } }`
  - 401: `{ message }`

Catalog and cart (the full contract lives in the backend repo, `arva-backend/CLAUDE.md`). The frontend uses:

- `GET /home`: banners (`carousel`, `promoStrips`, `sideBanners`, `verticalBanners`) and the `popular`, `fruits`, `equipments` product sections. A banner's `linkUrl`, `buttonLabel` and `subtitle` can be null.
- `GET /categories`: `{ categories: [{ id, slug, name, iconKey }] }`.
- `GET /products/:slug`: the product page data: images, variants, `defaultVariantId`, rating counts, the shop (name, city, logo, rating) and up to 10 `reviewPreview` reviews. The add-to-cart modal loads it through our own `GET /api/products/[slug]` route when it opens from a card.
- `GET /products/:slug/reviews?page=&limit=`: more reviews. The "Load more reviews" button reads it through our own `GET /api/products/[slug]/reviews` route.
- `GET /products?shop=&exclude=&sort=&limit=` ("Products from this shop") and `GET /products/recommended?exclude=&excludeShop=&limit=` ("Recommendation for you").
- `GET /cart` and `POST /cart` (Bearer token): the header reads the cart for the badge and drawer; the modal adds through our own `POST /api/cart` route, which forwards the token from the httpOnly cookie.
- `GET /auth/me` (Bearer token): `requireUser()` in `lib/auth/` calls it on the cart page to confirm the session. 401 means "log in again".
- Cart page (`/cart`). `GET /cart` items include `product.shop: { slug, name }`; items are grouped by `shop.slug`.
  - `PATCH /cart/items/:id`, body `{ quantity: 1..99 }`. 200: the full cart. 409 `{ code: "INSUFFICIENT_STOCK", message }` when above stock. 404 when the item is not in the user's cart.
  - `DELETE /cart/items`, body `{ itemIds: string[] }` (1 to 100). 200: the full cart after removal.
  - The browser calls our own `PATCH /api/cart/items/[id]` and `DELETE /api/cart/items`, which forward the token from the httpOnly cookie.
- Products page (`/products`): `GET /products?category=&sort=&discount=&minPrice=&maxPrice=&minRating=&city=&page=&limit=`. Send only values that are set. `minRating` is a whole number 1 to 5, `city` matches the stored city exactly (for example "Jakarta", "Kab. Bogor"), and a bad value returns 400 with `errors`. A list item has `shopSlug` and `shopName`. The page size is 12.
- Wishlist page (`/wishlist`), all need the Bearer token. The backend endpoints are built in a separate task; until then the page shows its error page.
  - `GET /wishlist`: `{ items: [{ id, addedAt, product: { id, slug, name, categorySlug, categoryName, price, originalPrice, discountPercent, rating, soldCount, city, imageUrl, shop: { slug, name }, isAvailable } }], itemCount }`, newest first. `id` is the wishlist entry id.
  - `POST /wishlist`, body `{ productId }` (numeric string). Idempotent. 200: the full wishlist. 404 `{ message }` for an unknown or inactive product.
  - `DELETE /wishlist/items`, body `{ itemIds }` (1 to 100 numeric strings of wishlist entry ids). Ids of other users are ignored. 200: the full wishlist. 400 for an empty list or a non-numeric id.
  - The browser calls our own `GET` and `POST /api/wishlist` and `DELETE /api/wishlist/items`, which forward the token from the httpOnly cookie.
- Checkout page (`/checkout`), all need the Bearer token. The backend endpoints are built in separate tasks; until then the page shows its error or "not available yet" messages. All ids are numeric strings and all money is integer IDR.
  - `POST /checkout`, body `{ itemIds }` (cart item ids): creates the draft and replaces any older one. `GET /checkout`: the draft, or 404 `{ message }` when there is none.
  - Draft: `{ items, address | null, damageProtection: { enabled, fee }, shipping | null, voucher | null, paymentMethod | null, summary: { productSubtotal, shippingSubtotal, buyerServiceFee, handlingFee, damageProtectionFee, discount, total } }`. Every amount is calculated by the backend; the frontend never adds money. `items[].id` is the cart item id.
  - The draft's `address` is its own copy. When the profile address exists, the backend copies it into the draft when the draft is created; after that the two are independent, and checkout never writes to the profile.
  - `PUT /checkout/address` (body: `{ label, province, city, district, subDistrict, street, recipientName, phone }`, each region `{ id, name }`), `PUT /checkout/damage-protection` `{ enabled }`, `PUT /checkout/shipping` `{ optionId }`, `PUT /checkout/voucher` `{ voucherId | null }`, `PUT /checkout/payment-method` `{ methodId }`. Each returns 200 with the full draft.
  - `GET /checkout/shipping-options` `{ options: [{ id, label, estimate, price }] }`, `GET /checkout/vouchers` `{ vouchers: [{ id, title, description, code, discountAmount }] }`, `GET /checkout/payment-methods` `{ methods: [{ id, label, available }] }`.
  - `POST /checkout/orders`: 201 `{ order: { id, code } }`. Until payments exist: 503 `{ code: "CHECKOUT_UNAVAILABLE", message }`.
  - Regions are NOT a backend endpoint. The address form gets them from https://wilayah.id (base URL in `REGIONS_API_BASE_URL`), through our own `/api/regions/provinces`, `/provinces/:code/cities`, `/cities/:code/districts` and `/districts/:code/sub-districts`, each `{ items: [{ id, name }] }`. A region `id` is its wilayah.id code (`31`, `31.71`, `31.71.07`, `31.71.07.1001`), not a number. The backend receives these ids and names in `PUT /checkout/address`.
  - The browser calls our own `/api/checkout/...` routes (one proxy with a list of allowed routes), which forward the token from the httpOnly cookie.
- Profile page (`/profile`), all need the Bearer token. The backend endpoints are built in a separate task; until then the page shows its error page, and saving shows "Profile update failed. Please try again."
  - `GET /profile`: `{ user: { username, name, email, phone | null, photoUrl | null }, address: { street, subDistrict, district, city, province, zipCode } | null }`. Each region is `{ id, name }`; region ids are wilayah.id codes (text).
  - `PUT /profile`, body `{ name (1-50), username (3-30, letters, numbers, underscores), email (max 254), phone (optional "+", 8-15 digits, or null) }`. 200: the full profile. 400 `{ message, errors: { field: message } }`. 409 `{ message, field: "username" | "email" }`.
  - `PUT /profile/address`, body `{ street (1-200), subDistrict: { id }, district: { id }, city: { id }, province: { id }, zipCode (5 digits) }`. The backend checks that each region belongs to the one above it (with wilayah.id codes, by code prefix). 200: the full profile.
  - `PUT /profile/photo`: multipart, one image in the field `photo` (JPG, PNG or WebP, up to 2 MB). 200: the full profile. Not built yet.
  - The browser calls our own `PUT /api/profile`, `PUT /api/profile/address` and `PUT /api/profile/photo`, which forward the token from the httpOnly cookie. Regions come from `/api/regions/...` (see checkout).
- Shop pages (`/shops/[slug]`, `/my-shop`, `/my-shop/edit`). The backend endpoints are built in a separate task; until then the pages show their error states.
  - `GET /shops/:slug` (public, optional Bearer token): `{ shop: { slug, name, city, logoUrl | null, description, operatingHours: { open, close } ("HH:MM"), rating: { average, ratingCount }, productCount, isOwner, ownerDetails: null | { contact: { email, phone | null }, address: { street, zipCode, province, city, district, subDistrict } | null, shippingChannels: [{ id, name }] } } }`. `ownerDetails` is null unless `isOwner`. 404 `{ message: "Shop not found." }`. A missing or invalid token means guest, not an error.
  - `GET /shops/:slug/products?page=&limit=` (public, optional token; the page asks for limit 8): `{ products: [{ id, slug, name, imageUrl, categoryName, price, originalPrice, discountPercent, rating, soldCount, city, shop: { slug, name }, manage: null | { isActive, totalStock, variantLabels, ratingCount } }], pagination }`. Guests get active products with `manage` null; the owner gets active and inactive products with `manage` filled.
  - `GET /shops/me` (Bearer): `{ shop: { slug, name, logoUrl, description, operatingHours, provinceId, cityId, districtId, subDistrictId, street, zipCode, email, phone, shippingChannelIds } }`, or 404 `{ message: "Shop not found." }` when the user has no shop.
  - `PUT /shops/me` (Bearer, owner): body `{ name (3-50), provinceId, cityId, districtId, subDistrictId, street (1-200), email, phone (optional "+", 8-15 digits, or null), openingTime, closingTime ("HH:MM", closing later than opening), shippingChannelIds (at least 1) }`. 200: the same shape as `GET /shops/me`. 400 `{ message, errors: { field: message } }` (field names as in the body). 409 `{ message, field: "name" }`.
  - `POST /shops` (Bearer, a user without a shop): the same body as `PUT /shops/me`. 201: `{ shop }` in the `GET /shops/me` shape. 400 `{ message, errors: { field: message } }`. 409 `{ message, field: "name" }` when the shop name is taken, or 409 `{ message }` when the user already has a shop. The wizard's identity step (name, IC number, agreement) is checked in the form only and is not sent: the backend must define where the IC number goes before the frontend sends it.
  - `GET /shipping-channels` (public): `{ items: [{ id, name }] }`.
  - Region ids in shop requests and responses are numeric strings: the wilayah.id code without dots (`31.71.07` is `317107`; 2, 4, 6 and 10 digits for province, city, district and sub-district). The backend must accept up to 10 digits and store the ids as text or bigint: a 10-digit sub-district code does not fit a 32-bit integer or a `^\d{1,9}$` check. The frontend converts both ways (`state/shop-regions.ts`). The browser calls our own `PUT /api/shops/me`, which forwards the token from the httpOnly cookie.

Planned endpoint groups (no contract yet): `/products`, `/categories`, `/shops`, `/shops/me`, `/products/mine`, `/cart`, `/wishlist`, `/orders`, `/vouchers`, `/reviews`. Each group gets a contract here before its feature begins.

If a backend change is needed, update this section and `docs/DECISIONS.md` first, then the code.

## 8. Keeping this file current

Read `docs/FEATURES.md` for status. When a feature starts, moves status, or finishes, update its row in the same commit as the code. Update section 1a and 1b when roles or domain terms change.

## 9. Working across two devices

Assume the work happens on two machines. Keep them in sync with these rules.

- Everything that matters lives in Git: code, docs, `CLAUDE.md`, and `docs/`. Anything only on one machine does not count as done.
- Start every session with `git pull`. End every session with a commit and `git push`, even if the work is unfinished. Use a `WIP:` prefix for unfinished work.
- Never keep the only copy of a decision in a chat. If you decide something, write it in `docs/DECISIONS.md` and commit it.
- Each machine has its own `.env` file. Keep the same keys in `.env.example`, and never copy real secret values through chat or Git.
- Pin the Node.js version in `.nvmrc` (use Node 20 LTS unless the project says otherwise). Run `node -v` on both machines before starting.
- After pulling, run `npm install` if `package.json` or `package-lock.json` changed.
- Use one branch per task, for example `feature/auth-login`. Merge to `main` only after the checks pass.
- Commit messages follow Conventional Commits: `feat(auth): add login form`, `fix(auth): redirect after login`, `docs: update decisions`.
