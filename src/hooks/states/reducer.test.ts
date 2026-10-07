import { describe, it, expect } from "vitest";
import usersReducer, { clearProfile } from "./reducer";

describe("usersReducer", () => {
  it("returns initial state", () => {
    const state = usersReducer(undefined, { type: "unknown" });
    expect(state.users).toEqual([]);
    expect(state.profile).toBeNull();
  });

  it("clears profile", () => {
    const prev = usersReducer(undefined, { type: "unknown" });
    const withProfile = {
      ...prev,
      profile: { id: 1, name: "A", email: "a@a.com" },
    };
    expect(usersReducer(withProfile, clearProfile()).profile).toBeNull();
  });
});
