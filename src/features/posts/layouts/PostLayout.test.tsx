import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "@/test-utils";
import PostLayout from "./PostLayout";
import { getProfileApi } from "@/features/users/api/userApi";

const nav = vi.hoisted(() => ({
  router: { replace: vi.fn(), push: vi.fn(), back: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => nav.router,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/users/api/userApi", () => ({
  getAllUsersApi: vi.fn(),
  getProfileApi: vi.fn(),
  updateProfileApi: vi.fn(),
  changePhotoApi: vi.fn(),
  changePasswordApi: vi.fn(),
}));

vi.mock("@/features/auth/api/authApi", () => ({
  loginApi: vi.fn(),
  registerApi: vi.fn(),
  logoutApi: vi.fn().mockResolvedValue(undefined),
}));

const profile = { id: 1, name: "Rouli", email: "rouli@del.ac.id" };

describe("PostLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(getProfileApi).mockResolvedValue({
      status: "success",
      message: "ok",
      data: { user: profile },
    });
  });

  it("tanpa access token: mengarahkan ke login, menampilkan 'Memuat sesi...', dan tidak memuat profil", () => {
    renderWithProviders(
      <PostLayout>
        <p>Isi halaman</p>
      </PostLayout>
    );

    expect(nav.router.replace).toHaveBeenCalledWith("/auth/login");
    expect(screen.getByText("Memuat sesi...")).toBeInTheDocument();
    expect(screen.queryByText("Isi halaman")).not.toBeInTheDocument();
    expect(getProfileApi).not.toHaveBeenCalled();
  });

  it("dengan access token: memuat profil lalu menampilkan navbar, sidebar, dan children", async () => {
    localStorage.setItem("accessToken", "tok");

    const { store } = renderWithProviders(
      <PostLayout>
        <p>Isi halaman</p>
      </PostLayout>
    );

    expect(screen.getByText("Memuat sesi...")).toBeInTheDocument();
    expect(await screen.findByText("Isi halaman")).toBeInTheDocument();

    expect(getProfileApi).toHaveBeenCalledTimes(1);
    expect(nav.router.replace).not.toHaveBeenCalled();
    expect(store.getState().users.profile).toEqual(profile);
    expect(screen.getByText("Delcom Posts")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Semua Postingan" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toContainElement(
      screen.getByText("Isi halaman")
    );
    expect(screen.queryByText("Memuat sesi...")).not.toBeInTheDocument();
  });

  it("profil gagal dimuat (token tidak valid): token dihapus dan diarahkan ke login", async () => {
    localStorage.setItem("accessToken", "tok");
    vi.mocked(getProfileApi).mockRejectedValue(new Error("Unauthorized"));

    const { store } = renderWithProviders(
      <PostLayout>
        <p>Isi halaman</p>
      </PostLayout>
    );

    await waitFor(() =>
      expect(nav.router.replace).toHaveBeenCalledWith("/auth/login")
    );
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(screen.queryByText("Isi halaman")).not.toBeInTheDocument();
    expect(screen.getByText("Memuat sesi...")).toBeInTheDocument();
    expect(store.getState().users.profile).toBeNull();
  });

  it("respons profil tanpa data pengguna: diperlakukan sebagai sesi tidak valid", async () => {
    localStorage.setItem("accessToken", "tok");
    vi.mocked(getProfileApi).mockResolvedValue({ status: "success", message: "ok" });

    renderWithProviders(
      <PostLayout>
        <p>Isi halaman</p>
      </PostLayout>
    );

    await waitFor(() =>
      expect(nav.router.replace).toHaveBeenCalledWith("/auth/login")
    );
    expect(localStorage.getItem("accessToken")).toBeNull();
  });

  it("tombol menu di navbar membuka sidebar mobile; klik overlay menutupnya kembali", async () => {
    localStorage.setItem("accessToken", "tok");
    const { container } = renderWithProviders(
      <PostLayout>
        <p>Isi halaman</p>
      </PostLayout>
    );
    await screen.findByText("Isi halaman");

    expect(container.querySelector(".bg-black\\/40")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Toggle menu" }));
    const overlay = container.querySelector(".bg-black\\/40") as Element;
    expect(overlay).toBeInTheDocument();

    await userEvent.click(overlay);
    await waitFor(() =>
      expect(container.querySelector(".bg-black\\/40")).not.toBeInTheDocument()
    );
  });
});
