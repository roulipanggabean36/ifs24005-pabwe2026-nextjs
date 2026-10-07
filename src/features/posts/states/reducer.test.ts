import { describe, it, expect } from "vitest";
import postsReducer, { resetPostFlags, clearPost } from "./reducer";

describe("postsReducer", () => {
  it("returns initial state", () => {
    const state = postsReducer(undefined, { type: "unknown" });
    expect(state.posts).toEqual([]);
    expect(state.post).toBeNull();
  });

  it("clears post", () => {
    const prev = postsReducer(undefined, { type: "unknown" });
    const withPost = { ...prev, post: { id: 1, user_id: 1, description: "x" } };
    expect(postsReducer(withPost, clearPost()).post).toBeNull();
  });

  it("resets flags", () => {
    const prev = postsReducer(undefined, { type: "unknown" });
    const flagged = { ...prev, isPostAdded: true, isPostDeleted: true };
    const next = postsReducer(flagged, resetPostFlags());
    expect(next.isPostAdded).toBe(false);
    expect(next.isPostDeleted).toBe(false);
  });
});
