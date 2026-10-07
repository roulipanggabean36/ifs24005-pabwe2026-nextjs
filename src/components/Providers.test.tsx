import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Providers from "./Providers";
import { useAppSelector } from "@/hooks/redux";

function Consumer() {
  const authUser = useAppSelector((state) => state.auth.authUser);
  return <p>{authUser === null ? "belum login" : "login"}</p>;
}

describe("Providers", () => {
  it("menyediakan Redux store ke seluruh anak komponen", () => {
    render(
      <Providers>
        <Consumer />
      </Providers>
    );
    expect(screen.getByText("belum login")).toBeInTheDocument();
  });
});
