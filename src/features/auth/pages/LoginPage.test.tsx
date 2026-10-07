import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor, fireEvent } from "@/test-utils";
import LoginPage from "./LoginPage";
import authReducer from "../states/reducer";
import { loginApi } from "../api/authApi";
import { showErrorDialog, showSuccessDialog } from "@/helpers/toolsHelper";

const nav = vi.hoisted(() => ({
  router: { replace: vi.fn(), push: vi.fn(), back: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => nav.router,
}));

vi.mock("../api/authApi", () => ({
  loginApi: vi.fn(),
  registerApi: vi.fn(),
  logoutApi: vi.fn(),
}));

vi.mock("@/helpers/toolsHelper", () => ({
  showSuccessDialog: vi.fn(),
  showErrorDialog: vi.fn(),
  showConfirmDialog: vi.fn(),
}));

const initialAuth = authReducer(undefined, { type: "@@INIT" });
const user = { id: 1, name: "Rouli", email: "rouli@del.ac.id" };

function getForm() {
  return screen.getByRole("button", { name: "Masuk" }).closest("form") as HTMLFormElement;
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(showSuccessDialog).mockResolvedValue(undefined as never);
    vi.mocked(showErrorDialog).mockResolvedValue(undefined as never);
  });

  it("merender judul, field, tombol, dan tautan ke halaman daftar", () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Masuk" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Kata Sandi")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Masuk" })).toBeEnabled();
    expect(screen.getByRole("link", { name: "Daftar" })).toHaveAttribute(
      "href",
      "/auth/register"
    );
  });

  it("memperbarui nilai input email dan kata sandi saat diketik", async () => {
    const u = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await u.type(screen.getByLabelText("Email"), "a@b.com");
    await u.type(screen.getByLabelText("Kata Sandi"), "rahasia");

    expect(screen.getByLabelText("Email")).toHaveValue("a@b.com");
    expect(screen.getByLabelText("Kata Sandi")).toHaveValue("rahasia");
  });

  it("tidak memanggil API ketika email dan kata sandi kosong", () => {
    renderWithProviders(<LoginPage />);

    fireEvent.submit(getForm());

    expect(loginApi).not.toHaveBeenCalled();
    expect(nav.router.replace).not.toHaveBeenCalled();
  });

  it("tidak memanggil API ketika email terisi tetapi kata sandi kosong", async () => {
    const u = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await u.type(screen.getByLabelText("Email"), "a@b.com");
    fireEvent.submit(getForm());

    expect(loginApi).not.toHaveBeenCalled();
  });

  it("login berhasil: memanggil API, menyimpan user ke store, dan mengalihkan ke beranda", async () => {
    vi.mocked(loginApi).mockResolvedValue({
      status: "success",
      message: "Login sukses",
      data: { user, token: "tok-123" },
    });
    const u = userEvent.setup();
    const { store } = renderWithProviders(<LoginPage />);

    await u.type(screen.getByLabelText("Email"), "rouli@del.ac.id");
    await u.type(screen.getByLabelText("Kata Sandi"), "rahasia123");
    await u.click(screen.getByRole("button", { name: "Masuk" }));

    await waitFor(() => expect(nav.router.replace).toHaveBeenCalledWith("/"));
    expect(loginApi).toHaveBeenCalledWith("rouli@del.ac.id", "rahasia123");
    expect(showSuccessDialog).toHaveBeenCalledWith("Login sukses");
    expect(store.getState().auth.authUser).toEqual(user);
    expect(store.getState().auth.isAuthLogin).toBe(false);
  });

  it("login gagal: menampilkan dialog error dan tidak mengalihkan halaman", async () => {
    vi.mocked(loginApi).mockRejectedValue(new Error("Email atau sandi salah"));
    const u = userEvent.setup();
    const { store } = renderWithProviders(<LoginPage />);

    await u.type(screen.getByLabelText("Email"), "a@b.com");
    await u.type(screen.getByLabelText("Kata Sandi"), "salah");
    await u.click(screen.getByRole("button", { name: "Masuk" }));

    await waitFor(() =>
      expect(showErrorDialog).toHaveBeenCalledWith("Email atau sandi salah")
    );
    await waitFor(() => expect(store.getState().auth.isAuthLogin).toBe(false));
    expect(nav.router.replace).not.toHaveBeenCalled();
    expect(store.getState().auth.authUser).toBeNull();
  });

  it("menampilkan 'Memproses...' dan menonaktifkan tombol saat isAuthLogin true", () => {
    renderWithProviders(<LoginPage />, {
      preloadedState: { auth: { ...initialAuth, isAuthLogin: true } },
    });

    const button = screen.getByRole("button", { name: "Memproses..." });
    expect(button).toBeDisabled();
  });

  it("langsung mengalihkan ke beranda ketika authUser sudah ada di store", () => {
    renderWithProviders(<LoginPage />, {
      preloadedState: { auth: { ...initialAuth, authUser: user } },
    });

    expect(nav.router.replace).toHaveBeenCalledWith("/");
  });

  it("tidak mengalihkan saat mount jika authUser belum ada", () => {
    renderWithProviders(<LoginPage />);

    expect(nav.router.replace).not.toHaveBeenCalled();
  });
});
