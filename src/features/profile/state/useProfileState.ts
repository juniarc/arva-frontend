"use client";

import { useCallback, useEffect, useReducer } from "react";
import { updateAddress, updateProfile, uploadPhoto, type ProfileApiResult } from "../api/profile.client";
import { toAddressRequest, toInfoRequest } from "../mappers/profile.mapper";
import { PROFILE_ADDRESS_FIELDS, type ProfileAddressValues } from "../schemas/profile-address.schema";
import { PROFILE_INFO_FIELDS, type ProfileInfoValues } from "../schemas/profile.schema";
import type { Profile, ProfileSection } from "../types";
import { createInitialState, profileReducer } from "./profile-reducer";

export const SUCCESS_HIDE_MS = 4_000;

/** What a section's form needs to know after a save: done, or messages to show under its fields. */
export type SaveOutcome = { ok: true } | { ok: false; fieldErrors: Record<string, string> };

/** The messages for the fields this section knows. A 409 names its field; a 400 lists them. */
export function fieldErrorsFrom(
  result: Extract<ProfileApiResult, { ok: false }>,
  known: readonly string[],
): Record<string, string> {
  const messages: Record<string, string> = {};
  if (result.status === 409 && result.field && known.includes(result.field)) messages[result.field] = result.message;
  if (result.status === 400) {
    for (const [field, message] of Object.entries(result.errors ?? {})) {
      if (known.includes(field)) messages[field] = message;
    }
  }
  return messages;
}

export function useProfileState(initialProfile: Profile) {
  const [state, dispatch] = useReducer(profileReducer, initialProfile, createInitialState);
  const { notice } = state;

  // A success message goes away by itself. An error stays until it is closed or the user acts.
  useEffect(() => {
    if (notice?.kind !== "success") return;
    const timer = setTimeout(() => dispatch({ type: "noticeDismissed" }), SUCCESS_HIDE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const runSave = useCallback(
    async (section: ProfileSection, known: readonly string[], send: () => Promise<ProfileApiResult>): Promise<SaveOutcome> => {
      dispatch({ type: "saveStarted", section });
      const result = await send();
      if (result.ok) {
        dispatch({ type: "saveSucceeded", section, profile: result.data });
        return { ok: true };
      }
      const fieldErrors = fieldErrorsFrom(result, known);
      dispatch({ type: "saveFailed", showNotice: Object.keys(fieldErrors).length === 0 });
      return { ok: false, fieldErrors };
    },
    [],
  );

  const saveInfo = useCallback(
    (values: ProfileInfoValues) => runSave("info", PROFILE_INFO_FIELDS, () => updateProfile(toInfoRequest(values))),
    [runSave],
  );
  const saveAddress = useCallback(
    (values: ProfileAddressValues) => runSave("address", PROFILE_ADDRESS_FIELDS, () => updateAddress(toAddressRequest(values))),
    [runSave],
  );

  const changePhoto = useCallback(async (file: File): Promise<boolean> => {
    const result = await uploadPhoto(file);
    dispatch(result.ok ? { type: "photoSaved", profile: result.data } : { type: "photoFailed" });
    return result.ok;
  }, []);

  return {
    profile: state.profile,
    modes: state.modes,
    saving: state.saving,
    notice: state.notice,
    startEdit: (section: ProfileSection) => dispatch({ type: "editStarted", section }),
    cancelEdit: (section: ProfileSection) => dispatch({ type: "editCancelled", section }),
    dismissNotice: () => dispatch({ type: "noticeDismissed" }),
    saveInfo,
    saveAddress,
    changePhoto,
  };
}
