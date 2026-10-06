import { describe, it, expect } from "vitest";
import authReducer, { clearAuthUser } from "./reducer";

describe("authReducer", () => {
  const initial = {
    isAuthLogin: false,
    isAuthRegister: false,
    isAuthLogout: false,
    authUser: null,
  };

  it("returns initial state", () => {
    expect(authReducer(undefined, { type: "unknown" })).toEqual(initial);
  });

  it("clears auth user", () => {
    const state = {
      ...initial,
      authUser: { id: 1, name: "Test", email: "t@t.com" },
    };
    expect(authReducer(state, clearAuthUser()).authUser).toBeNull();
  });
});

describe("authReducer - login tanpa payload", () => {
  it("fulfilled tanpa payload mengosongkan authUser", async () => {
    const { asyncLogin } = await import("./action");
    const state = authReducer(
      {
        isAuthLogin: true,
        isAuthRegister: false,
        isAuthLogout: false,
        authUser: { id: 1, name: "A", email: "a@a.com" },
      },
      asyncLogin.fulfilled(undefined, "req", { email: "a", password: "b" })
    );
    expect(state.authUser).toBeNull();
    expect(state.isAuthLogin).toBe(false);
  });
});
