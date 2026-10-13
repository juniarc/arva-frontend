import { describe, expect, it } from "vitest";
import { makeProfile } from "../profile.fixture";
import {
  createInitialState,
  FAILURE_MESSAGE,
  profileReducer,
  SUCCESS_MESSAGE,
  type ProfileAction,
  type ProfileState,
} from "./profile-reducer";

const start = () => createInitialState(makeProfile());
const run = (state: ProfileState, ...actions: ProfileAction[]) => actions.reduce(profileReducer, state);

describe("profileReducer", () => {
  it("starts with both sections in read mode", () => {
    expect(start().modes).toEqual({ info: "read", address: "read" });
  });

  it("entering edit mode changes only that section", () => {
    expect(run(start(), { type: "editStarted", section: "info" }).modes).toEqual({ info: "edit", address: "read" });
    expect(run(start(), { type: "editStarted", section: "address" }).modes).toEqual({ info: "read", address: "edit" });
  });

  it("cancel returns to read mode and keeps the last loaded profile", () => {
    const initial = start();
    const state = run(initial, { type: "editStarted", section: "info" }, { type: "editCancelled", section: "info" });

    expect(state.modes.info).toBe("read");
    expect(state.profile).toBe(initial.profile);
  });

  it("cancel clears a failure message", () => {
    const state = run(
      start(),
      { type: "editStarted", section: "info" },
      { type: "saveStarted", section: "info" },
      { type: "saveFailed", showNotice: true },
      { type: "editCancelled", section: "info" },
    );
    expect(state.notice).toBeNull();
  });

  it("a successful save replaces the profile with the response, returns to read mode and shows success", () => {
    const saved = makeProfile({ user: { ...makeProfile().user, name: "New Name" } });
    const state = run(
      start(),
      { type: "editStarted", section: "info" },
      { type: "saveStarted", section: "info" },
      { type: "saveSucceeded", section: "info", profile: saved },
    );

    expect(state.profile).toBe(saved);
    expect(state.modes.info).toBe("read");
    expect(state.saving).toBeNull();
    expect(state.notice).toMatchObject({ kind: "success", message: SUCCESS_MESSAGE });
  });

  it("saving one section leaves the other section's mode alone", () => {
    const state = run(
      start(),
      { type: "editStarted", section: "info" },
      { type: "editStarted", section: "address" },
      { type: "saveStarted", section: "info" },
      { type: "saveSucceeded", section: "info", profile: makeProfile() },
    );
    expect(state.modes).toEqual({ info: "read", address: "edit" });
  });

  it("a failed save keeps edit mode and the profile, and shows the failure message", () => {
    const initial = start();
    const state = run(
      initial,
      { type: "editStarted", section: "info" },
      { type: "saveStarted", section: "info" },
      { type: "saveFailed", showNotice: true },
    );

    expect(state.modes.info).toBe("edit");
    expect(state.profile).toBe(initial.profile);
    expect(state.saving).toBeNull();
    expect(state.notice).toMatchObject({ kind: "error", message: FAILURE_MESSAGE });
  });

  it("a failure shown under a field does not add the banner", () => {
    const state = run(
      start(),
      { type: "editStarted", section: "info" },
      { type: "saveStarted", section: "info" },
      { type: "saveFailed", showNotice: false },
    );
    expect(state.notice).toBeNull();
    expect(state.modes.info).toBe("edit");
  });

  it("does not start or cancel an edit while a save is running", () => {
    const saving = run(start(), { type: "editStarted", section: "info" }, { type: "saveStarted", section: "info" });

    expect(profileReducer(saving, { type: "editStarted", section: "address" })).toBe(saving);
    expect(profileReducer(saving, { type: "editCancelled", section: "info" })).toBe(saving);
  });

  it("a photo answer replaces the profile without touching the modes", () => {
    const saved = makeProfile({ user: { ...makeProfile().user, photoUrl: "https://cdn.test/a.jpg" } });
    const state = run(start(), { type: "editStarted", section: "address" }, { type: "photoSaved", profile: saved });

    expect(state.profile).toBe(saved);
    expect(state.modes.address).toBe("edit");
    expect(state.notice?.kind).toBe("success");
  });

  it("a failed photo shows the failure message and keeps the profile", () => {
    const initial = start();
    const state = run(initial, { type: "photoFailed" });
    expect(state.profile).toBe(initial.profile);
    expect(state.notice).toMatchObject({ kind: "error", message: FAILURE_MESSAGE });
  });

  it("gives each notice a new id, so the hide timer restarts", () => {
    const first = run(start(), { type: "photoFailed" });
    const second = run(first, { type: "photoFailed" });
    expect(second.notice?.id).not.toBe(first.notice?.id);
  });

  it("dismissing removes the notice", () => {
    expect(run(start(), { type: "photoFailed" }, { type: "noticeDismissed" }).notice).toBeNull();
  });
});
