import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/test-utils";
import SidebarComponent from "./SidebarComponent";

const nav = vi.hoisted(() => ({ pathname: "/", tab: null as string | null }));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.tab ? { tab: nav.tab } : {}),
}));

function linkByName(name: string) {
  return screen.getByRole("link", { name });
}

function isActive(name: string) {
  return linkByName(name).className.includes("bg-teal-50");
}

// jsdom belum mengimplementasikan navigasi dokumen; cegah default klik <a> agar log tetap bersih.
const preventNavigation = (e: Event) => {
  if ((e.target as Element).closest("a")) e.preventDefault();
};

describe("SidebarComponent", () => {
  beforeEach(() => {
    nav.pathname = "/";
    nav.tab = null;
    document.addEventListener("click", preventNavigation);
  });

  afterEach(() => {
    document.removeEventListener("click", preventNavigation);
  });

  it("merender keempat menu dengan href yang benar", () => {
    renderWithProviders(<SidebarComponent />);

    expect(linkByName("Semua Postingan")).toHaveAttribute("href", "/");
    expect(linkByName("Postingan Saya")).toHaveAttribute("href", "/?tab=me");
    expect(linkByName("Daftar Pengguna")).toHaveAttribute("href", "/users");
    expect(linkByName("Profil Saya")).toHaveAttribute("href", "/profile");
  });

  it("tanpa prop open: overlay tidak ada dan sidebar tersembunyi di mobile", () => {
    const { container } = renderWithProviders(<SidebarComponent />);

    expect(container.querySelector(".bg-black\\/40")).not.toBeInTheDocument();
    expect(container.querySelector("aside")?.className).toContain(
      "-translate-x-full"
    );
  });

  it("open=true: overlay tampil dan sidebar bergeser masuk", () => {
    const { container } = renderWithProviders(
      <SidebarComponent open onClose={vi.fn()} />
    );

    expect(container.querySelector(".bg-black\\/40")).toBeInTheDocument();
    expect(container.querySelector("aside")?.className).toContain(
      "translate-x-0"
    );
    expect(container.querySelector("aside")?.className).not.toContain(
      "-translate-x-full"
    );
  });

  it("klik overlay memanggil onClose", async () => {
    const onClose = vi.fn();
    const { container } = renderWithProviders(
      <SidebarComponent open onClose={onClose} />
    );

    await userEvent.click(container.querySelector(".bg-black\\/40") as Element);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("klik tombol tutup (X) memanggil onClose", async () => {
    const onClose = vi.fn();
    renderWithProviders(<SidebarComponent open onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "Tutup menu" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("klik salah satu menu memanggil onClose", async () => {
    const onClose = vi.fn();
    renderWithProviders(<SidebarComponent open onClose={onClose} />);

    await userEvent.click(linkByName("Daftar Pengguna"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("klik overlay, tombol X, dan menu tanpa onClose tidak menimbulkan error", async () => {
    const { container } = renderWithProviders(<SidebarComponent open />);

    await userEvent.click(container.querySelector(".bg-black\\/40") as Element);
    await userEvent.click(screen.getByRole("button", { name: "Tutup menu" }));
    await userEvent.click(linkByName("Profil Saya"));

    expect(linkByName("Profil Saya")).toBeInTheDocument();
  });

  it("pathname '/' tanpa tab: hanya 'Semua Postingan' aktif", () => {
    nav.pathname = "/";
    renderWithProviders(<SidebarComponent />);

    expect(isActive("Semua Postingan")).toBe(true);
    expect(isActive("Postingan Saya")).toBe(false);
    expect(isActive("Daftar Pengguna")).toBe(false);
    expect(isActive("Profil Saya")).toBe(false);
  });

  it("pathname '/' dengan ?tab=me: hanya 'Postingan Saya' aktif", () => {
    nav.pathname = "/";
    nav.tab = "me";
    renderWithProviders(<SidebarComponent />);

    expect(isActive("Postingan Saya")).toBe(true);
    expect(isActive("Semua Postingan")).toBe(false);
    expect(isActive("Daftar Pengguna")).toBe(false);
    expect(isActive("Profil Saya")).toBe(false);
  });

  it("pathname '/users': hanya 'Daftar Pengguna' aktif", () => {
    nav.pathname = "/users";
    renderWithProviders(<SidebarComponent />);

    expect(isActive("Daftar Pengguna")).toBe(true);
    expect(isActive("Semua Postingan")).toBe(false);
    expect(isActive("Postingan Saya")).toBe(false);
    expect(isActive("Profil Saya")).toBe(false);
  });

  it("pathname '/profile': hanya 'Profil Saya' aktif", () => {
    nav.pathname = "/profile";
    renderWithProviders(<SidebarComponent />);

    expect(isActive("Profil Saya")).toBe(true);
    expect(isActive("Daftar Pengguna")).toBe(false);
  });

  it("pathname '/posts/1' (halaman detail): tidak ada menu yang aktif", () => {
    nav.pathname = "/posts/1";
    renderWithProviders(<SidebarComponent />);

    expect(isActive("Semua Postingan")).toBe(false);
    expect(isActive("Postingan Saya")).toBe(false);
    expect(isActive("Daftar Pengguna")).toBe(false);
    expect(isActive("Profil Saya")).toBe(false);
  });
});