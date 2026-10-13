"use client";

import { BackButton } from "@/features/products/components/BackButton";
import { useProfileState } from "../state/useProfileState";
import type { Profile } from "../types";
import { AddressSection } from "./AddressSection";
import { ProfileInfoSection } from "./ProfileInfoSection";
import { ProfilePhoto } from "./ProfilePhoto";
import { SectionFeedback } from "./SectionFeedback";

/** Owns the profile and each section's mode. The two sections save separately. */
export function ProfilePage({ initialProfile }: { initialProfile: Profile }) {
  const state = useProfileState(initialProfile);
  const busy = state.saving !== null;

  return (
    <>
      {/* Mobile and tablet: the back arrow under the global header (the header already has search, cart and menu). */}
      <div className="flex items-center px-2 py-1 lg:hidden">
        <BackButton className="bg-transparent shadow-none" />
      </div>

      <div className="mx-auto max-w-275 lg:px-6 lg:py-8">
        <div className="bg-white px-4 pb-6 lg:rounded-md lg:border lg:border-line/30 lg:p-8">
          <SectionFeedback notice={state.notice} onClose={state.dismissNotice} />
          <h1 className="sr-only font-serif text-3xl font-bold text-brand lg:not-sr-only lg:mb-6 lg:block">My Profile</h1>

          <div className="lg:grid lg:grid-cols-[15rem_1fr] lg:items-start lg:gap-8">
            <ProfilePhoto photoUrl={state.profile.user.photoUrl} onUpload={state.changePhoto} />

            <div>
              <ProfileInfoSection
                user={state.profile.user}
                editing={state.modes.info === "edit"}
                saving={state.saving === "info"}
                busy={busy}
                onEdit={() => state.startEdit("info")}
                onCancel={() => state.cancelEdit("info")}
                onSave={state.saveInfo}
              />
              <hr className="my-4 border-line/30" />
              <AddressSection
                address={state.profile.address}
                editing={state.modes.address === "edit"}
                saving={state.saving === "address"}
                busy={busy}
                onEdit={() => state.startEdit("address")}
                onCancel={() => state.cancelEdit("address")}
                onSave={state.saveAddress}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
