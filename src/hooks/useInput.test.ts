import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useInput from "./useInput";

describe("useInput", () => {
  it("initializes with default value", () => {
    const { result } = renderHook(() => useInput("hello"));
    expect(result.current[0]).toBe("hello");
  });

  it("updates value on change", () => {
    const { result } = renderHook(() => useInput(""));
    act(() => {
      result.current[1]({
        target: { value: "test" },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    expect(result.current[0]).toBe("test");
  });

  it("resets to default", () => {
    const { result } = renderHook(() => useInput("default"));
    act(() => {
      result.current[2]("changed");
    });
    expect(result.current[0]).toBe("changed");
    act(() => {
      result.current[3]();
    });
    expect(result.current[0]).toBe("default");
  });
});
