import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor, fireEvent } from "@/test-utils";
import RegisterPage from "./RegisterPage";
import authReducer from "../states/reducer";
import { registerApi } from "../api/authApi";
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

function getForm() {
  return screen.getByRole("button", { name: "Daftar" }).closest("form") as HTMLFormElement;
}

async function fillForm(
  u: ReturnType<typeof userEvent.setup>,
  { name = "Rouli", email = "rouli@del.ac.id", password = "rahasia123" } = {}
) {
  if (name) await u.type(screen.getByLabelText("Nama"), name);
  if (email) await u.type(screen.getByLabelText("Email"), email);
  if (password) await u.type(screen.getByLabelText("Kata Sandi"), password);
}

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(showSuccessDialog).mockResolvedValue(undefined as never);
    vi.mocked(showErrorDialog).mockResolvedValue(undefined as never);
  });

  it("merender judul, seluruh field, tombol, dan tautan ke halaman masuk", () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByRole("heading", { name: "Daftar" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nama")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Kata Sandi")).toHaveAttribute("minLength", "6");
    expect(screen.getByRole("button", { name: "Daftar" })).toBeEnabled();
    expect(screen.getByRole("link", { name: "Masuk" })).toHaveAttribute(
      "href",
      "/auth/login"
    );
  });

  it("memperbarui nilai input saat diketik", async () => {
    const u = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await fillForm(u);

    expect(screen.getByLabelText("Nama")).toHaveValue("Rouli");
    expect(screen.getByLabelText("Email")).toHaveValue("rouli@del.ac.id");
    expect(screen.getByLabelText("Kata Sandi")).toHaveValue("rahasia123");
  });

  it("tidak memanggil API ketika semua field kosong", () => {
    renderWithProviders(<RegisterPage />);

    fireEvent.submit(getForm());

    expect(registerApi).not.toHaveBeenCalled();
  });

  it("tidak memanggil API ketika nama terisi tetapi email kosong", async () => {
    const u = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await fillForm(u, { name: "Rouli", email: "", password: "" });
    fireEvent.submit(getForm());

    expect(registerApi).not.toHaveBeenCalled();
  });

  it("tidak memanggil API ketika nama & email terisi tetapi kata sandi kosong", async () => {
    const u = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await fillForm(u, { name: "Rouli", email: "rouli@del.ac.id", password: "" });
    fireEvent.submit(getForm());

    expect(registerApi).not.toHaveBeenCalled();
  });

  it("registrasi berhasil: memanggil API dan mengarahkan ke halaman login", async () => {
    vi.mocked(registerApi).mockResolvedValue({
      status: "success",
      message: "Registrasi sukses",
    });
    const u = userEvent.setup();
    const { store } = renderWithProviders(<RegisterPage />);

    await fillForm(u);
    await u.click(screen.getByRole("button", { name: "Daftar" }));

    await waitFor(() =>
      expect(nav.router.push).toHaveBeenCalledWith("/auth/login")
    );
    expect(registerApi).toHaveBeenCalledWith(
      "Rouli",
      "rouli@del.ac.id",
      "rahasia123"
    );
    expect(showSuccessDialog).toHaveBeenCalledWith("Registrasi sukses");
    expect(store.getState().auth.isAuthRegister).toBe(false);
  });

  it("registrasi gagal: menampilkan dialog error dan tidak berpindah halaman", async () => {
    vi.mocked(registerApi).mockRejectedValue(new Error("Email sudah terdaftar"));
    const u = userEvent.setup();
    const { store } = renderWithProviders(<RegisterPage />);

    await fillForm(u);
    await u.click(screen.getByRole("button", { name: "Daftar" }));

    await waitFor(() =>
      expect(showErrorDialog).toHaveBeenCalledWith("Email sudah terdaftar")
    );
    await waitFor(() =>
      expect(store.getState().auth.isAuthRegister).toBe(false)
    );
    expect(nav.router.push).not.toHaveBeenCalled();
  });

  it("menampilkan 'Memproses...' dan menonaktifkan tombol saat isAuthRegister true", () => {
    renderWithProviders(<RegisterPage />, {
      preloadedState: { auth: { ...initialAuth, isAuthRegister: true } },
    });

    expect(screen.getByRole("button", { name: "Memproses..." })).toBeDisabled();
  });
});
