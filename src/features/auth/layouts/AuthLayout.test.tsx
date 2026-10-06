import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test-utils";
import AuthLayout from "./AuthLayout";

// Router dibuat stabil (satu objek) agar dependency useEffect([router]) tidak berubah tiap render.
const nav = vi.hoisted(() => ({
  router: { replace: vi.fn(), push: vi.fn(), back: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => nav.router,
}));

describe("AuthLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("merender branding aplikasi dan children di dalam kartu", () => {
    renderWithProviders(
      <AuthLayout>
        <p>Konten anak</p>
      </AuthLayout>
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Delcom Posts" })
    ).toBeInTheDocument();
    expect(screen.getByText("Bagikan cerita dan ide Anda")).toBeInTheDocument();
    expect(screen.getByText("P")).toBeInTheDocument();
    expect(screen.getByText("Konten anak")).toBeInTheDocument();
  });

  it("tidak mengalihkan halaman ketika access token tidak ada", () => {
    renderWithProviders(
      <AuthLayout>
        <span>Form</span>
      </AuthLayout>
    );

    expect(nav.router.replace).not.toHaveBeenCalled();
  });

  it("mengalihkan ke beranda (router.replace('/')) ketika access token sudah ada", () => {
    localStorage.setItem("accessToken", "token-valid");

    renderWithProviders(
      <AuthLayout>
        <span>Form</span>
      </AuthLayout>
    );

    expect(nav.router.replace).toHaveBeenCalledTimes(1);
    expect(nav.router.replace).toHaveBeenCalledWith("/");
  });
});
