"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { SaveOutcome } from "../state/useProfileState";
import { PROFILE_INFO_FIELDS, PROFILE_LIMITS, profileInfoFormSchema, type ProfileInfoValues } from "../schemas/profile.schema";
import type { ProfileUser } from "../types";
import { INPUT_CLASS, ProfileField, ProfileFieldList } from "./ProfileField";
import { SavingOverlay } from "./SavingOverlay";
import { SectionHeader } from "./SectionHeader";

const HEADER_TEXT = {
  title: "Profile Info",
  headingId: "profile-info-heading",
  editText: "Edit Profile",
  editLabel: "Edit profile information",
  cancelLabel: "Cancel editing profile information",
  saveLabel: "Save profile information",
};

interface ProfileInfoSectionProps {
  user: ProfileUser;
  editing: boolean;
  /** This section is being saved: the overlay shows. */
  saving: boolean;
  /** Any section is being saved: nothing can be started or changed meanwhile. */
  busy: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (values: ProfileInfoValues) => Promise<SaveOutcome>;
}

type InfoField = (typeof PROFILE_INFO_FIELDS)[number];

/** The form exists only while editing, so Cancel (which leaves edit mode) discards what was typed. */
function ProfileInfoEditor({ user, busy, onCancel, onSave }: Pick<ProfileInfoSectionProps, "user" | "busy" | "onCancel" | "onSave">) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProfileInfoValues>({
    resolver: zodResolver(profileInfoFormSchema),
    // Checked on Save, then again on blur.
    mode: "onSubmit",
    reValidateMode: "onBlur",
    defaultValues: { name: user.name, username: user.username, email: user.email, phone: user.phone ?? "" },
  });

  const submit = handleSubmit(async (values) => {
    const outcome = await onSave(values);
    if (outcome.ok) return;
    for (const [field, message] of Object.entries(outcome.fieldErrors)) {
      setError(field as InfoField, { type: "server", message });
    }
  });

  return (
    <form onSubmit={submit} noValidate aria-labelledby={HEADER_TEXT.headingId}>
      <fieldset disabled={busy} className="m-0 min-w-0 border-0 p-0">
        <SectionHeader {...HEADER_TEXT} editing busy={busy} onEdit={() => undefined} onCancel={onCancel} />
        <ProfileFieldList editing>
          <ProfileField id="profile-name" label="Name" mode="edit" error={errors.name?.message}>
            {(aria) => <input {...aria} maxLength={PROFILE_LIMITS.name} autoComplete="name" className={INPUT_CLASS} {...register("name")} />}
          </ProfileField>
          <ProfileField id="profile-username" label="Username" mode="edit" error={errors.username?.message}>
            {(aria) => (
              <input {...aria} maxLength={PROFILE_LIMITS.usernameMax} autoComplete="username" className={INPUT_CLASS} {...register("username")} />
            )}
          </ProfileField>
          <ProfileField id="profile-email" label="Email" mode="edit" error={errors.email?.message}>
            {(aria) => (
              <input {...aria} type="email" maxLength={PROFILE_LIMITS.email} autoComplete="email" className={INPUT_CLASS} {...register("email")} />
            )}
          </ProfileField>
          <ProfileField id="profile-phone" label="Phone Number" mode="edit" error={errors.phone?.message}>
            {(aria) => <input {...aria} type="tel" inputMode="tel" autoComplete="tel" className={INPUT_CLASS} {...register("phone")} />}
          </ProfileField>
        </ProfileFieldList>
      </fieldset>
    </form>
  );
}

export function ProfileInfoSection({ user, editing, saving, busy, onEdit, onCancel, onSave }: ProfileInfoSectionProps) {
  return (
    <section aria-labelledby={HEADER_TEXT.headingId} className="relative">
      {editing ? (
        <ProfileInfoEditor user={user} busy={busy} onCancel={onCancel} onSave={onSave} />
      ) : (
        <>
          <SectionHeader {...HEADER_TEXT} editing={false} busy={busy} onEdit={onEdit} onCancel={onCancel} />
          <ProfileFieldList editing={false}>
            <ProfileField id="profile-name" label="Name" mode="read" value={user.name} />
            <ProfileField id="profile-username" label="Username" mode="read" value={user.username} />
            <ProfileField id="profile-email" label="Email" mode="read" value={user.email} />
            <ProfileField id="profile-phone" label="Phone Number" mode="read" value={user.phone} />
          </ProfileFieldList>
        </>
      )}
      {saving && <SavingOverlay />}
    </section>
  );
}
