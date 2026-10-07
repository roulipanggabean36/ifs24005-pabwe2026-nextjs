import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { store } from "@/store";
import { useAppDispatch, useAppSelector } from "./redux";

function wrapper({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

describe("redux typed hooks", () => {
  it("useAppDispatch mengembalikan dispatch store", () => {
    const { result } = renderHook(() => useAppDispatch(), { wrapper });
    expect(result.current).toBe(store.dispatch);
  });

  it("useAppSelector membaca state dari store", () => {
    const { result } = renderHook(
      () => useAppSelector((state) => state.auth.authUser),
      { wrapper }
    );
    expect(result.current).toBeNull();
  });
});
