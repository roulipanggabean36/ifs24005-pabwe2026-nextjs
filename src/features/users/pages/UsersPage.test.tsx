import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/test-utils";
import UsersPage from "./UsersPage";
import { getAllUsersApi } from "../api/userApi";
import type { User } from "@/types";

vi.mock("../api/userApi", () => ({
  getAllUsersApi: vi.fn(),
  getProfileApi: vi.fn(),
  updateProfileApi: vi.fn(),
  changePhotoApi: vi.fn(),
  changePasswordApi: vi.fn(),
}));

const users: User[] = [
  { id: 1, name: "rouli", email: "rouli@del.ac.id", photo: null },
  { id: 2, name: "Budi", email: "budi@example.com", photo: "https://img.test/budi.png" },
  { id: 3, name: "Siti", email: "siti@example.com" },
];

function respondUsers(list: User[]) {
  vi.mocked(getAllUsersApi).mockResolvedValue({
    status: "success",
    message: "ok",
    data: { users: list },
  });
}

describe("UsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    respondUsers(users);
  });

  it("memuat pengguna saat mount dan menampilkan judul serta jumlahnya", async () => {
    renderWithProviders(<UsersPage />);

    expect(
      screen.getByRole("heading", { name: /Daftar Pengguna/ })
    ).toBeInTheDocument();
    expect(await screen.findByText("budi@example.com")).toBeInTheDocument();
    expect(getAllUsersApi).toHaveBeenCalledTimes(1);
    expect(screen.getByText("3 pengguna terdaftar")).toBeInTheDocument();
  });

  it("menampilkan nama dan email setiap pengguna", async () => {
    renderWithProviders(<UsersPage />);

    await screen.findByText("rouli@del.ac.id");

    expect(screen.getByText("rouli")).toBeInTheDocument();
    expect(screen.getByText("Budi")).toBeInTheDocument();
    expect(screen.getByText("siti@example.com")).toBeInTheDocument();
  });

  it("pengguna dengan foto menampilkan gambar; tanpa foto menampilkan inisial kapital", async () => {
    renderWithProviders(<UsersPage />);
    await screen.findByText("Budi");

    expect(screen.getByAltText("Budi")).toHaveAttribute(
      "src",
      "https://img.test/budi.png"
    );
    expect(screen.getByText("R")).toBeInTheDocument(); // rouli, photo null
    expect(screen.getByText("S")).toBeInTheDocument(); // Siti, photo undefined
    expect(screen.queryByAltText("rouli")).not.toBeInTheDocument();
  });

  it("pengguna bernama kosong tanpa foto memakai inisial fallback 'U'", async () => {
    respondUsers([{ id: 9, name: "", email: "anon@example.com" }]);

    renderWithProviders(<UsersPage />);
    await screen.findByText("anon@example.com");

    expect(screen.getByText("U")).toBeInTheDocument();
  });

  it("pencarian berdasarkan nama (tidak peka huruf besar/kecil)", async () => {
    renderWithProviders(<UsersPage />);
    await screen.findByText("Budi");

    await userEvent.type(screen.getByPlaceholderText("Cari nama atau email..."), "BUDI");

    expect(screen.getByText("Budi")).toBeInTheDocument();
    expect(screen.queryByText("rouli")).not.toBeInTheDocument();
    expect(screen.queryByText("Siti")).not.toBeInTheDocument();
  });

  it("pencarian berdasarkan email", async () => {
    renderWithProviders(<UsersPage />);
    await screen.findByText("Budi");

    await userEvent.type(screen.getByPlaceholderText("Cari nama atau email..."), "del.ac.id");

    expect(screen.getByText("rouli")).toBeInTheDocument();
    expect(screen.queryByText("Budi")).not.toBeInTheDocument();
  });

  it("kata kunci spasi saja dianggap kosong: semua pengguna tampil", async () => {
    renderWithProviders(<UsersPage />);
    await screen.findByText("Budi");

    await userEvent.type(screen.getByPlaceholderText("Cari nama atau email..."), "   ");

    expect(screen.getByText("rouli")).toBeInTheDocument();
    expect(screen.getByText("Budi")).toBeInTheDocument();
    expect(screen.getByText("Siti")).toBeInTheDocument();
    expect(screen.queryByText("Tidak ada pengguna ditemukan")).not.toBeInTheDocument();
  });

  it("tidak ada yang cocok: menampilkan 'Tidak ada pengguna ditemukan'", async () => {
    renderWithProviders(<UsersPage />);
    await screen.findByText("Budi");

    await userEvent.type(screen.getByPlaceholderText("Cari nama atau email..."), "tidak-ada");

    expect(screen.getByText("Tidak ada pengguna ditemukan")).toBeInTheDocument();
    // jumlah total di header tidak ikut terfilter
    expect(screen.getByText("3 pengguna terdaftar")).toBeInTheDocument();
  });

  it("daftar kosong dari server: menampilkan pesan kosong dan 0 pengguna", async () => {
    respondUsers([]);

    renderWithProviders(<UsersPage />);

    expect(await screen.findByText("Tidak ada pengguna ditemukan")).toBeInTheDocument();
    expect(screen.getByText("0 pengguna terdaftar")).toBeInTheDocument();
  });

  it("permintaan gagal: halaman tetap tampil dengan pesan kosong", async () => {
    vi.mocked(getAllUsersApi).mockRejectedValue(new Error("Offline"));

    renderWithProviders(<UsersPage />);

    expect(await screen.findByText("Tidak ada pengguna ditemukan")).toBeInTheDocument();
  });

  it("pengguna tanpa nama/email tidak menyebabkan error saat pencarian", async () => {
    respondUsers([
      { id: 1, name: undefined as never, email: undefined as never },
      { id: 2, name: "Budi", email: "budi@example.com" },
    ]);
    renderWithProviders(<UsersPage />);
    await screen.findByText("Budi");

    await userEvent.type(screen.getByPlaceholderText("Cari nama atau email..."), "budi");

    expect(screen.getByText("Budi")).toBeInTheDocument();
  });
});
