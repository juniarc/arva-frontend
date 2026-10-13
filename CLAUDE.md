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
- Not used yet: `GET /shops/:slug`.

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
