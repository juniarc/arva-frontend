import type { Profile, ProfileSection } from "../types";

export const SUCCESS_MESSAGE = "Profile Updated Successfully";
export const FAILURE_MESSAGE = "Profile update failed. Please try again.";

export type SectionMode = "read" | "edit";

export interface Notice {
  /** A new id for each notice, so the auto-hide timer restarts for a new one. */
  id: number;
  kind: "success" | "error";
  message: string;
}

export interface ProfileState {
  /** The profile as last loaded from the server. Cancel goes back to this. */
  profile: Profile;
  modes: Record<ProfileSection, SectionMode>;
  /** The section being saved. Only one save runs at a time, so two answers can never cross. */
  saving: ProfileSection | null;
  notice: Notice | null;
  nextNoticeId: number;
}

export type ProfileAction =
  | { type: "editStarted"; section: ProfileSection }
  | { type: "editCancelled"; section: ProfileSection }
  | { type: "saveStarted"; section: ProfileSection }
  | { type: "saveSucceeded"; section: ProfileSection; profile: Profile }
  /** `showNotice` is false when the problem was shown under a field instead. */
  | { type: "saveFailed"; showNotice: boolean }
  | { type: "photoSaved"; profile: Profile }
  | { type: "photoFailed" }
  | { type: "noticeDismissed" };

export function createInitialState(profile: Profile): ProfileState {
  return { profile, modes: { info: "read", address: "read" }, saving: null, notice: null, nextNoticeId: 1 };
}

function withNotice(state: ProfileState, kind: Notice["kind"], message: string): ProfileState {
  return { ...state, notice: { id: state.nextNoticeId, kind, message }, nextNoticeId: state.nextNoticeId + 1 };
}

export function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
  switch (action.type) {
    case "editStarted":
      if (state.saving) return state;
      return { ...state, notice: null, modes: { ...state.modes, [action.section]: "edit" } };

    case "editCancelled":
      // The form is discarded with the section's edit mode, so what the user typed is gone.
      if (state.saving) return state;
      return { ...state, notice: null, modes: { ...state.modes, [action.section]: "read" } };

    case "saveStarted":
      return { ...state, saving: action.section, notice: null };

    case "saveSucceeded":
      return withNotice(
        { ...state, profile: action.profile, saving: null, modes: { ...state.modes, [action.section]: "read" } },
        "success",
        SUCCESS_MESSAGE,
      );

    case "saveFailed":
      // Edit mode stays, so the user's values stay.
      return action.showNotice ? withNotice({ ...state, saving: null }, "error", FAILURE_MESSAGE) : { ...state, saving: null };

    case "photoSaved":
      return withNotice({ ...state, profile: action.profile }, "success", SUCCESS_MESSAGE);

    case "photoFailed":
      return withNotice(state, "error", FAILURE_MESSAGE);

    case "noticeDismissed":
      return { ...state, notice: null };
  }
}
