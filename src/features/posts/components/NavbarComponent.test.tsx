import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "@/test-utils";
import NavbarComponent from "./NavbarComponent";
import usersReducer from "@/features/users/states/reducer";
import { logoutApi } from "@/features/auth/api/authApi";

const nav = vi.hoisted(() => ({
  router: { replace: vi.fn(), push: vi.fn(), back: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => nav.router,
}));

vi.mock("@/features/auth/api/authApi", () => ({
  loginApi: vi.fn(),
  registerApi: vi.fn(),
  logoutApi: vi.fn(),
}));

const initialUsers = usersReducer(undefined, { type: "@@INIT" });

function withProfile(profile: unknown) {
  return { preloadedState: { users: { ...initialUsers, profile } } };
}

describe("NavbarComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(logoutApi).mockResolvedValue(undefined);
  });

  it("tanpa profil: menampilkan nama 'Pengguna' dan ikon user (tanpa inisial/foto)", () => {
    const { container } = renderWithProviders(<NavbarComponent />);

    expect(screen.getByText("Pengguna")).toBeInTheDocument();
    expect(screen.getByText("Delcom Posts")).toBeInTheDocument();
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.querySelector("svg.tabler-icon-user")).toBeInTheDocument();
  });

  it("profil tanpa foto: menampilkan inisial huruf kapital nama", () => {
    renderWithProviders(
      <NavbarComponent />,
      withProfile({ id: 1, name: "rouli", email: "r@del.ac.id", photo: null })
    );

    expect(screen.getByText("R")).toBeInTheDocument();
    expect(screen.getByText("rouli")).toBeInTheDocument();
  });

  it("profil dengan foto: menampilkan gambar dengan alt nama", () => {
    renderWithProviders(
      <NavbarComponent />,
      withProfile({
        id: 1,
        name: "Rouli",
        email: "r@del.ac.id",
        photo: "https://img.test/p.png",
      })
    );

    const img = screen.getByAltText("Rouli");
    expect(img).toHaveAttribute("src", "https://img.test/p.png");
  });

  it("profil bernama kosong dan tanpa foto: fallback ke ikon user dan teks 'Pengguna'", () => {
    const { container } = renderWithProviders(
      <NavbarComponent />,
      withProfile({ id: 1, name: "", email: "r@del.ac.id" })
    );

    expect(container.querySelector("svg.tabler-icon-user")).toBeInTheDocument();
    expect(screen.getByText("Pengguna")).toBeInTheDocument();
  });

  it("tautan logo mengarah ke '/'", () => {
    renderWithProviders(<NavbarComponent />);

    expect(
      screen.getByRole("link", { name: /Delcom Posts/ })
    ).toHaveAttribute("href", "/");
  });

  it("dropdown tertutup di awal, terbuka saat avatar diklik, dan menampilkan identitas profil", async () => {
    renderWithProviders(
      <NavbarComponent />,
      withProfile({ id: 1, name: "Rouli", email: "rouli@del.ac.id" })
    );
    const trigger = screen.getByRole("button", { name: /Rouli/ });

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(trigger);

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("rouli@del.ac.id")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Profil Saya" })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("menuitem", { name: "Postingan Saya" })).toHaveAttribute("href", "/?tab=me");
    expect(screen.getByRole("menuitem", { name: "Daftar Pengguna" })).toHaveAttribute("href", "/users");
  });

  it("dropdown tanpa profil: menampilkan 'Pengguna' dan '-'", async () => {
    renderWithProviders(<NavbarComponent />);

    await userEvent.click(screen.getByRole("button", { name: /Pengguna/ }));

    expect(screen.getAllByText("Pengguna")).toHaveLength(2);
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("klik avatar dua kali menutup dropdown", async () => {
    renderWithProviders(<NavbarComponent />);
    const trigger = screen.getByRole("button", { name: /Pengguna/ });

    await userEvent.click(trigger);
    await userEvent.click(trigger);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("klik di luar dropdown menutupnya; klik di dalam dropdown tidak", async () => {
    renderWithProviders(<NavbarComponent />);
    await userEvent.click(screen.getByRole("button", { name: /Pengguna/ }));

    await userEvent.click(screen.getByRole("menu"));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await userEvent.click(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("klik item dropdown menutup dropdown", async () => {
    renderWithProviders(<NavbarComponent />);
    await userEvent.click(screen.getByRole("button", { name: /Pengguna/ }));

    const item = screen.getByRole("menuitem", { name: "Daftar Pengguna" });
    item.addEventListener("click", (e) => e.preventDefault());
    await userEvent.click(item);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("tombol menu memanggil onToggleSidebar", async () => {
    const onToggle = vi.fn();
    renderWithProviders(<NavbarComponent onToggleSidebar={onToggle} />);

    await userEvent.click(screen.getByRole("button", { name: "Toggle menu" }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("tombol menu tanpa onToggleSidebar tidak menimbulkan error", async () => {
    renderWithProviders(<NavbarComponent />);

    await userEvent.click(screen.getByRole("button", { name: "Toggle menu" }));

    expect(screen.getByRole("button", { name: "Toggle menu" })).toBeInTheDocument();
  });

  it("logout berhasil: memanggil API, menghapus token, dan mengarahkan ke login", async () => {
    localStorage.setItem("accessToken", "tok");
    const { store } = renderWithProviders(
      <NavbarComponent />,
      { preloadedState: { auth: { isAuthLogin: false, isAuthRegister: false, isAuthLogout: false, authUser: { id: 1, name: "R", email: "r@x.com" } } } }
    );

    await userEvent.click(screen.getByTitle("Keluar"));

    await waitFor(() =>
      expect(nav.router.replace).toHaveBeenCalledWith("/auth/login")
    );
    expect(logoutApi).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(store.getState().auth.authUser).toBeNull();
  });

  it("logout gagal di server: tetap mengarahkan ke login dan menghapus token", async () => {
    localStorage.setItem("accessToken", "tok");
    vi.mocked(logoutApi).mockRejectedValue(new Error("Server down"));
    renderWithProviders(<NavbarComponent />);

    await userEvent.click(screen.getByTitle("Keluar"));

    await waitFor(() =>
      expect(nav.router.replace).toHaveBeenCalledWith("/auth/login")
    );
    expect(localStorage.getItem("accessToken")).toBeNull();
  });
});
