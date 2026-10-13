import { ProfileField, ProfileFieldList } from "@/features/profile/components/ProfileField";
import type { OwnerDetails } from "../types";

const CARD = "rounded-md border border-line/30 p-4";
const HEADING = "font-serif text-lg font-bold text-ink";

/** Owner only: contact, address and shipping channels. It renders only the details the backend sent. */
export function OwnerShopDetails({ details }: { details: OwnerDetails }) {
  const { contact, address, shippingChannels } = details;

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-3">
      <section aria-labelledby="shop-info-heading" className={CARD}>
        <h2 id="shop-info-heading" className={HEADING}>
          Shop Information
        </h2>
        <ProfileFieldList editing={false}>
          <ProfileField id="shop-info-email" label="Email" mode="read" value={contact.email} />
          <ProfileField id="shop-info-phone" label="Phone Number" mode="read" value={contact.phone} />
        </ProfileFieldList>
      </section>

      <section aria-labelledby="shop-address-heading" className={CARD}>
        <h2 id="shop-address-heading" className={HEADING}>
          Shop Address
        </h2>
        {address ? (
          <ProfileFieldList editing={false}>
            <ProfileField id="shop-address-street" label="Address Street" mode="read" value={address.street} />
            <ProfileField id="shop-address-sub-district" label="Sub-district" mode="read" value={address.subDistrict.name} />
            <ProfileField id="shop-address-district" label="District" mode="read" value={address.district.name} />
            <ProfileField id="shop-address-city" label="City" mode="read" value={address.city.name} />
            <ProfileField id="shop-address-province" label="Province" mode="read" value={address.province.name} />
            <ProfileField id="shop-address-zip" label="Zip Code" mode="read" value={address.zipCode} />
          </ProfileFieldList>
        ) : (
          <p className="py-2 text-sm text-muted">No address yet.</p>
        )}
      </section>

      <section aria-labelledby="shop-channels-heading" className={CARD}>
        <h2 id="shop-channels-heading" className={HEADING}>
          Shipping Channels
        </h2>
        {shippingChannels.length > 0 ? (
          <ul className="mt-2 space-y-1 text-sm text-ink">
            {shippingChannels.map((channel) => (
              <li key={channel.id}>{channel.name}</li>
            ))}
          </ul>
        ) : (
          <p className="py-2 text-sm text-muted">No shipping channels yet.</p>
        )}
      </section>
    </div>
  );
}
