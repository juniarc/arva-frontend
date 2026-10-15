/** What the navbar shows about the logged-in user. */
export interface NavbarUser {
  /** Null only when neither GET /auth/me nor GET /profile could be read. */
  username: string | null;
  /** Null when it could not be read: the profile menu then leaves the email row out. */
  email: string | null;
  /** Null when the user has no photo: the default avatar is shown. */
  photoUrl: string | null;
}

export interface NavbarCartItem {
  id: string;
  name: string;
  imageUrl: string;
  variantLabel: string;
  /** Integer IDR for one unit. */
  unitPrice: number;
  quantity: number;
}

export interface NavbarCart {
  itemCount: number;
  items: NavbarCartItem[];
}

export type NavbarShop =
  | { status: "none" }
  | {
      status: "shop";
      slug: string;
      name: string;
      logoUrl: string | null;
      /** Null when the public shop page data could not be read. */
      city: string | null;
      rating: { average: number; ratingCount: number } | null;
    };

/**
 * Everything the navbar renders. A summary that could not be loaded is null, and its trigger falls
 * back to the default state: one failure never breaks the navbar.
 */
export type NavbarSession =
  | { kind: "guest" }
  | { kind: "user"; user: NavbarUser; cart: NavbarCart | null; shop: NavbarShop | null };
