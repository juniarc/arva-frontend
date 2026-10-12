import Link from "next/link";
import { InstagramIcon, TikTokIcon, XIcon, YouTubeIcon } from "@/components/icons/brand-icons";
import { getCategories } from "@/features/products/api/catalog.server";
import { categoryHref, categoryIcon } from "@/features/products/data/categories";

// Placeholder social URLs until real accounts exist.
const SOCIAL_LINKS = [
  { label: "Arva on X", href: "#", icon: XIcon },
  { label: "Arva on Instagram", href: "#", icon: InstagramIcon },
  { label: "Arva on TikTok", href: "#", icon: TikTokIcon },
  { label: "Arva on YouTube", href: "#", icon: YouTubeIcon },
];

const HEADING = "mb-3 font-serif text-xl font-bold";

/** Dark green site footer. Four columns on desktop, stacked on mobile. */
export async function SiteFooter() {
  const categories = await getCategories();

  return (
    <footer className="bg-brand text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-2 md:px-6 lg:grid-cols-4">
        <div>
          <p className="mb-3 font-serif text-3xl font-black">Arva</p>
          <p className="text-sm font-light leading-relaxed text-white/80">
            Arva is your trusted marketplace connecting farmers and consumers directly. Inspired by the Latin word for
            &lsquo;field,&rsquo; Arva embodies our mission to bring the freshest agricultural products, from fruits and
            vegetables to seeds and farming equipment, straight from the source to your doorstep.
          </p>
        </div>

        <nav aria-labelledby="footer-categories">
          <h2 id="footer-categories" className={HEADING}>
            Categories
          </h2>
          <ul className="grid grid-cols-2 gap-x-4 lg:grid-cols-1">
            {categories.map(({ id, slug, name, iconKey }) => {
              const Icon = categoryIcon(iconKey);
              return (
                <li key={id}>
                  <Link
                    href={categoryHref(slug)}
                    className="flex min-h-11 items-center gap-3 text-sm hover:underline focus-visible:outline-2 focus-visible:outline-white"
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div>
          <h2 className={HEADING}>Contact Info</h2>
          <dl className="flex flex-col gap-3 text-sm">
            <div>
              <dt className="font-medium">Office address :</dt>
              <dd className="font-light text-white/80">Jl. Cinta No.43, Kahyangan, Jakarta, DKI Jakarta, Indonesia</dd>
            </div>
            <div>
              <dt className="font-medium">Phone :</dt>
              <dd className="font-light text-white/80">+62 123 142 124</dd>
            </div>
            <div>
              <dt className="font-medium">Email :</dt>
              <dd className="font-light text-white/80">arva@example.com</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className={HEADING}>Our Social Media</h2>
          <ul className="flex gap-1">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  aria-label={label}
                  className="flex size-11 items-center justify-center text-promo hover:opacity-80 focus-visible:outline-2 focus-visible:outline-white"
                >
                  <Icon className="size-5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
