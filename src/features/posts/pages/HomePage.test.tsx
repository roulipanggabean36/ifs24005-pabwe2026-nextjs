import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor, within } from "@/test-utils";
import HomePage from "./HomePage";
import usersReducer from "@/features/users/states/reducer";
import * as postApi from "../api/postApi";
import {
  showConfirmDialog,
  showErrorDialog,
  showSuccessDialog,
} from "@/helpers/toolsHelper";
import type { Post } from "@/types";

const nav = vi.hoisted(() => ({
  search: "" as string,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(nav.search),
}));

vi.mock("../api/postApi", () => ({
  getAllPostsApi: vi.fn(),
  getDetailPostApi: vi.fn(),
  addPostApi: vi.fn(),
  updatePostApi: vi.fn(),
  changeCoverPostApi: vi.fn(),
  deletePostApi: vi.fn(),
  likePostApi: vi.fn(),
  addCommentApi: vi.fn(),
  deleteCommentApi: vi.fn(),
  deleteAllPostsApi: vi.fn(),
}));

vi.mock("@/helpers/toolsHelper", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/helpers/toolsHelper")>();
  return {
    ...actual,
    showSuccessDialog: vi.fn(),
    showErrorDialog: vi.fn(),
    showConfirmDialog: vi.fn(),
  };
});

const api = vi.mocked(postApi);
const initialUsers = usersReducer(undefined, { type: "@@INIT" });
const me = { id: 1, name: "Rouli", email: "rouli@del.ac.id" };
const ok = { status: "success" as const, message: "Berhasil" };

const postA: Post = {
  id: 1,
  user_id: 1,
  description: "Belajar Vitest dengan seru",
  created_at: "2026-01-01T10:00:00Z",
  author: { name: "Rouli", photo: null },
  cover: "https://img.test/a.png",
  likes: [1, 5],
  comments: [{ id: 1, comment: "x" }, { id: 2, comment: "y" }],
};

const postB: Post = {
  id: 2,
  user_id: 2,
  description: "Redux Toolkit itu praktis",
  author: { name: "Budi", photo: "https://img.test/budi.png" },
  likes: [],
  comments: [],
};

const postC: Post = {
  id: 3,
  user_id: 3,
  description: "Tanpa penulis",
  likes: undefined,
  comments: undefined,
};

function respondPosts(posts: Post[]) {
  api.getAllPostsApi.mockResolvedValue({
    status: "success",
    message: "ok",
    data: { posts },
  });
}

function renderPage(profile: unknown = me) {
  return renderWithProviders(<HomePage />, {
    preloadedState: { users: { ...initialUsers, profile } },
  });
}

// jsdom belum mengimplementasikan navigasi dokumen; cegah default klik <a>.
const preventNavigation = (e: Event) => {
  if ((e.target as Element).closest("a")) e.preventDefault();
};

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nav.search = "";
    respondPosts([postA, postB]);
    vi.mocked(showSuccessDialog).mockResolvedValue(undefined as never);
    vi.mocked(showErrorDialog).mockResolvedValue(undefined as never);
    vi.mocked(showConfirmDialog).mockResolvedValue(true);
    document.addEventListener("click", preventNavigation);
  });

  afterEach(() => {
    document.removeEventListener("click", preventNavigation);
  });

  describe("pemuatan & daftar posting", () => {
    it("tab 'Semua': memuat tanpa filter dan menampilkan judul serta jumlah posting", async () => {
      renderPage();

      expect(
        screen.getByRole("heading", { name: "Semua Postingan" })
      ).toBeInTheDocument();
      await screen.findByText("Belajar Vitest dengan seru");
      expect(api.getAllPostsApi).toHaveBeenCalledWith(undefined);
      expect(screen.getByText("2 postingan")).toBeInTheDocument();
      expect(screen.getByText("Redux Toolkit itu praktis")).toBeInTheDocument();
    });

    it("tab 'me': memuat dengan isMe=true dan memakai judul 'Postingan Saya'", async () => {
      nav.search = "tab=me";

      renderPage();

      expect(
        screen.getByRole("heading", { name: "Postingan Saya" })
      ).toBeInTheDocument();
      await screen.findByText("Belajar Vitest dengan seru");
      expect(api.getAllPostsApi).toHaveBeenCalledWith(true);
    });

    it("tab aktif ditandai pada tautan yang sesuai", async () => {
      const { unmount } = renderPage();
      await screen.findByText("Belajar Vitest dengan seru");
      expect(screen.getByRole("link", { name: "Semua" }).className).toContain("border-teal-600");
      expect(screen.getByRole("link", { name: "Milik Saya" }).className).toContain("border-transparent");
      unmount();

      nav.search = "tab=me";
      renderPage();
      await screen.findByText("Belajar Vitest dengan seru");
      expect(screen.getByRole("link", { name: "Milik Saya" }).className).toContain("border-teal-600");
      expect(screen.getByRole("link", { name: "Semua" }).className).toContain("border-transparent");
    });

    it("menampilkan 'Memuat postingan...' selama permintaan berjalan", () => {
      api.getAllPostsApi.mockReturnValue(new Promise(() => {}));

      renderPage();

      expect(screen.getByText("Memuat postingan...")).toBeInTheDocument();
      expect(screen.queryByText("Belum ada postingan")).not.toBeInTheDocument();
    });

    it("daftar kosong: menampilkan 'Belum ada postingan'", async () => {
      respondPosts([]);

      renderPage();

      expect(await screen.findByText("Belum ada postingan")).toBeInTheDocument();
      expect(screen.getByText("0 postingan")).toBeInTheDocument();
    });

    it("permintaan gagal: tidak ada kartu dan pesan kosong tampil", async () => {
      api.getAllPostsApi.mockRejectedValue(new Error("Offline"));

      renderPage();

      expect(await screen.findByText("Belum ada postingan")).toBeInTheDocument();
    });
  });

  describe("kartu posting", () => {
    it("menampilkan cover (tautan ke detail), foto penulis, jumlah suka dan komentar", async () => {
      const { container } = renderPage();
      await screen.findByText("Belajar Vitest dengan seru");

      expect(container.querySelector('img[src="https://img.test/a.png"]')).toBeInTheDocument();
      expect(container.querySelector('img[src="https://img.test/budi.png"]')).toBeInTheDocument();
      const cards = screen.getAllByRole("article");
      expect(within(cards[0]).getByText("Rouli")).toBeInTheDocument();
      expect(within(cards[0]).getAllByRole("link").some((l) => l.getAttribute("href") === "/posts/1")).toBe(true);
      expect(within(cards[0]).getByRole("button", { name: "2" })).toBeInTheDocument();
      expect(within(cards[0]).getByRole("link", { name: "2" })).toHaveAttribute("href", "/posts/1");
    });

    it("tanpa penulis, likes, dan comments: fallback 'Pengguna', inisial 'U', jumlah 0", async () => {
      respondPosts([postC]);

      renderPage();
      await screen.findByText("Tanpa penulis");

      const card = screen.getByRole("article");
      expect(within(card).getByText("Pengguna")).toBeInTheDocument();
      expect(within(card).getByText("U")).toBeInTheDocument();
      expect(within(card).getByRole("button", { name: "0" })).toBeInTheDocument();
      expect(within(card).getByRole("link", { name: "0" })).toBeInTheDocument();
    });

    it("penulis ber-nama tanpa foto: menampilkan inisial huruf kapital", async () => {
      respondPosts([{ ...postB, author: { name: "budi", photo: null } }]);

      renderPage();
      await screen.findByText("Redux Toolkit itu praktis");

      expect(screen.getByText("B")).toBeInTheDocument();
    });

    it("penulis dengan nama kosong dan tanpa foto: inisial fallback 'U'", async () => {
      respondPosts([{ ...postB, author: { name: "" } }]);

      renderPage();
      await screen.findByText("Redux Toolkit itu praktis");

      expect(screen.getByText("U")).toBeInTheDocument();
    });

    it("kartu tanpa cover tidak merender gambar cover", async () => {
      respondPosts([postB]);

      renderPage();
      await screen.findByText("Redux Toolkit itu praktis");

      expect(screen.getByRole("article").querySelectorAll('img[src*="cover"]')).toHaveLength(0);
    });

    it("tombol suka yang sudah disukai berwarna merah", async () => {
      renderPage();
      await screen.findByText("Belajar Vitest dengan seru");

      const [cardA, cardB] = screen.getAllByRole("article");
      expect(within(cardA).getByRole("button", { name: "2" }).className).toContain("text-red-500");
      expect(within(cardB).getByRole("button", { name: "0" }).className).not.toContain("text-red-500 ");
    });
  });

  describe("pencarian", () => {
    it("memfilter berdasarkan deskripsi (tidak peka huruf besar/kecil)", async () => {
      renderPage();
      await screen.findByText("Belajar Vitest dengan seru");

      await userEvent.type(screen.getByPlaceholderText("Cari postingan..."), "VITEST");

      expect(screen.getByText("Belajar Vitest dengan seru")).toBeInTheDocument();
      expect(screen.queryByText("Redux Toolkit itu praktis")).not.toBeInTheDocument();
    });

    it("memfilter berdasarkan nama penulis", async () => {
      renderPage();
      await screen.findByText("Belajar Vitest dengan seru");

      await userEvent.type(screen.getByPlaceholderText("Cari postingan..."), "budi");

      expect(screen.getByText("Redux Toolkit itu praktis")).toBeInTheDocument();
      expect(screen.queryByText("Belajar Vitest dengan seru")).not.toBeInTheDocument();
    });

    it("kata kunci spasi saja dianggap kosong (semua posting tampil)", async () => {
      renderPage();
      await screen.findByText("Belajar Vitest dengan seru");

      await userEvent.type(screen.getByPlaceholderText("Cari postingan..."), "   ");

      expect(screen.getAllByRole("article")).toHaveLength(2);
    });

    it("posting tanpa penulis tidak error saat dicari dan tidak cocok jika kata kunci berbeda", async () => {
      respondPosts([postC, postA]);
      renderPage();
      await screen.findByText("Tanpa penulis");

      await userEvent.type(screen.getByPlaceholderText("Cari postingan..."), "rouli");

      expect(screen.queryByText("Tanpa penulis")).not.toBeInTheDocument();
      expect(screen.getByText("Belajar Vitest dengan seru")).toBeInTheDocument();
    });

    it("tidak ada yang cocok: menampilkan 'Belum ada postingan'", async () => {
      renderPage();
      await screen.findByText("Belajar Vitest dengan seru");

      await userEvent.type(screen.getByPlaceholderText("Cari postingan..."), "zzzz");

      expect(screen.getByText("Belum ada postingan")).toBeInTheDocument();
    });
  });

  describe("suka", () => {
    it("belum disukai: mengirim like=1 lalu memuat ulang daftar", async () => {
      api.likePostApi.mockResolvedValue(ok);
      renderPage();
      await screen.findByText("Redux Toolkit itu praktis");
      api.getAllPostsApi.mockClear();

      const cardB = screen.getAllByRole("article")[1];
      await userEvent.click(within(cardB).getByRole("button", { name: "0" }));

      await waitFor(() => expect(api.getAllPostsApi).toHaveBeenCalledTimes(1));
      expect(api.likePostApi).toHaveBeenCalledWith(2, 1);
    });

    it("sudah disukai: mengirim like=0", async () => {
      api.likePostApi.mockResolvedValue(ok);
      renderPage();
      await screen.findByText("Belajar Vitest dengan seru");

      const cardA = screen.getAllByRole("article")[0];
      await userEvent.click(within(cardA).getByRole("button", { name: "2" }));

      await waitFor(() => expect(api.likePostApi).toHaveBeenCalledWith(1, 0));
    });

    it("profil belum termuat: dianggap belum menyukai (like=1)", async () => {
      api.likePostApi.mockResolvedValue(ok);
      renderPage(null);
      await screen.findByText("Belajar Vitest dengan seru");

      const cardA = screen.getAllByRole("article")[0];
      await userEvent.click(within(cardA).getByRole("button", { name: "2" }));

      await waitFor(() => expect(api.likePostApi).toHaveBeenCalledWith(1, 1));
    });

    it("gagal: dialog error tampil dan daftar tetap dimuat ulang", async () => {
      api.likePostApi.mockRejectedValue(new Error("Gagal like"));
      renderPage();
      await screen.findByText("Redux Toolkit itu praktis");
      api.getAllPostsApi.mockClear();

      const cardB = screen.getAllByRole("article")[1];
      await userEvent.click(within(cardB).getByRole("button", { name: "0" }));

      await waitFor(() => expect(showErrorDialog).toHaveBeenCalledWith("Gagal like"));
      await waitFor(() => expect(api.getAllPostsApi).toHaveBeenCalled());
    });
  });

  describe("tambah posting", () => {
    it("tombol 'Posting' membuka modal; berhasil menambah memuat ulang daftar dan menutup modal", async () => {
      api.addPostApi.mockResolvedValue({ ...ok, data: { post_id: 50 } });
      renderPage();
      await screen.findByText("Belajar Vitest dengan seru");
      expect(screen.queryByText("Postingan Baru")).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "Posting" }));
      expect(screen.getByText("Postingan Baru")).toBeInTheDocument();
      api.getAllPostsApi.mockClear();

      await userEvent.type(
        screen.getByPlaceholderText("Apa yang ingin Anda bagikan?"),
        "Posting baru"
      );
      await userEvent.click(screen.getByRole("button", { name: "Publikasikan" }));

      await waitFor(() => expect(api.addPostApi).toHaveBeenCalledWith("Posting baru"));
      await waitFor(() => expect(api.getAllPostsApi).toHaveBeenCalledTimes(1));
      await waitFor(() =>
        expect(screen.queryByText("Postingan Baru")).not.toBeInTheDocument()
      );
    });

    it("menutup modal lewat 'Batal' tanpa memanggil API", async () => {
      renderPage();
      await screen.findByText("Belajar Vitest dengan seru");

      await userEvent.click(screen.getByRole("button", { name: "Posting" }));
      await userEvent.click(screen.getByRole("button", { name: "Batal" }));

      expect(screen.queryByText("Postingan Baru")).not.toBeInTheDocument();
      expect(api.addPostApi).not.toHaveBeenCalled();
    });
  });

  describe("hapus semua", () => {
    it("tidak tampil pada tab 'Semua'", async () => {
      renderPage();
      await screen.findByText("Belajar Vitest dengan seru");

      expect(screen.queryByRole("button", { name: /Hapus Semua/ })).not.toBeInTheDocument();
    });

    it("tidak tampil pada tab 'me' ketika belum ada posting", async () => {
      nav.search = "tab=me";
      respondPosts([]);

      renderPage();
      await screen.findByText("Belum ada postingan");

      expect(screen.queryByRole("button", { name: /Hapus Semua/ })).not.toBeInTheDocument();
    });

    it("tab 'me' + konfirmasi ya: menghapus semua lalu memuat ulang", async () => {
      nav.search = "tab=me";
      api.deleteAllPostsApi.mockResolvedValue(ok);
      renderPage();
      await screen.findByText("Belajar Vitest dengan seru");
      api.getAllPostsApi.mockClear();
      respondPosts([]);

      await userEvent.click(screen.getByRole("button", { name: /Hapus Semua/ }));

      await waitFor(() => expect(api.deleteAllPostsApi).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(api.getAllPostsApi).toHaveBeenCalledWith(true));
      expect(await screen.findByText("Belum ada postingan")).toBeInTheDocument();
    });

    it("tab 'me' + konfirmasi batal: API hapus tidak dipanggil, daftar tetap dimuat ulang", async () => {
      nav.search = "tab=me";
      vi.mocked(showConfirmDialog).mockResolvedValue(false);
      renderPage();
      await screen.findByText("Belajar Vitest dengan seru");
      api.getAllPostsApi.mockClear();

      await userEvent.click(screen.getByRole("button", { name: /Hapus Semua/ }));

      await waitFor(() => expect(api.getAllPostsApi).toHaveBeenCalledTimes(1));
      expect(api.deleteAllPostsApi).not.toHaveBeenCalled();
    });
  });
});
