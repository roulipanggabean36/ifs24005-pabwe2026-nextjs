import { describe, it, expect } from "vitest";
import { store } from "./store";

describe("store", () => {
  it("has auth, users, posts slices", () => {
    const state = store.getState();
    expect(state).toHaveProperty("auth");
    expect(state).toHaveProperty("users");
    expect(state).toHaveProperty("posts");
  });
});
