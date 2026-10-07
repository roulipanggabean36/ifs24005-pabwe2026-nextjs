import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor, fireEvent } from "@/test-utils";
import DetailPage from "./DetailPage";
import usersReducer from "@/features/users/states/reducer";
import * as postApi from "../api/postApi";
import {
  showConfirmDialog,
  showErrorDialog,
  showSuccessDialog,
} from "@/helpers/toolsHelper";
import type { Post } from "@/types";

const nav = vi.hoisted(() => ({
  router: { replace: vi.fn(), push: vi.fn(), back: vi.fn() },
  params: { postId: "7" } as Record<string, string> | null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => nav.router,
  useParams: () => nav.params,
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

// formatDate dipertahankan asli; hanya dialog SweetAlert yang diganti mock.
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

const basePost: Post = {
  id: 7,
  user_id: 1,
  description: "Isi postingan lengkap",
  created_at: "2026-01-01T10:00:00Z",
  author: { name: "rouli", photo: null },
  cover: null,
  likes: [2, 3],
  comments: [
    { id: 1, comment: "Komentar pertama", created_at: "2026-01-02T10:00:00Z" },
    { id: 2, comment: "Komentar kedua" },
  ],
  my_comment: null,
};

function respondWith(post: Post | undefined) {
  api.getDetailPostApi.mockResolvedValue({
    status: "success",
    message: "ok",
    data: post ? { post } : undefined,
  });
}

function renderPage(profile: unknown = me) {
  return renderWithProviders(<DetailPage />, {
    preloadedState: { users: { ...initialUsers, profile } },
  });
}

async function renderLoaded(post: Post, profile: unknown = me) {
  respondWith(post);
  const utils = renderPage(profile);
  await screen.findByText(post.description);
  return utils;
}

const ok = { status: "success" as const, message: "Berhasil" };

describe("DetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nav.params = { postId: "7" };
    vi.mocked(showSuccessDialog).mockResolvedValue(undefined as never);
    vi.mocked(showErrorDialog).mockResolvedValue(undefined as never);
    vi.mocked(showConfirmDialog).mockResolvedValue(true);
    respondWith(basePost);
  });

  describe("pemuatan data", () => {
    it("memuat detail berdasarkan postId dari URL", async () => {
      await renderLoaded(basePost);

      expect(api.getDetailPostApi).toHaveBeenCalledWith("7");
    });

    it("menampilkan 'Memuat detail...' selama permintaan berjalan", () => {
      api.getDetailPostApi.mockReturnValue(new Promise(() => {}));

      renderPage();

      expect(screen.getByText("Memuat detail...")).toBeInTheDocument();
    });

    it("menampilkan 'Postingan tidak ditemukan' jika data kosong", async () => {
      respondWith(undefined);

      renderPage();

      expect(await screen.findByText("Postingan tidak ditemukan")).toBeInTheDocument();
    });

    it("menampilkan 'Postingan tidak ditemukan' jika permintaan gagal", async () => {
      api.getDetailPostApi.mockRejectedValue(new Error("404"));

      renderPage();

      expect(await screen.findByText("Postingan tidak ditemukan")).toBeInTheDocument();
    });

    it("tanpa postId pada params: tidak memanggil API", () => {
      nav.params = {};

      renderPage();

      expect(api.getDetailPostApi).not.toHaveBeenCalled();
      expect(screen.getByText("Postingan tidak ditemukan")).toBeInTheDocument();
    });

    it("params null: tidak memanggil API", () => {
      nav.params = null;

      renderPage();

      expect(api.getDetailPostApi).not.toHaveBeenCalled();
      expect(screen.getByText("Postingan tidak ditemukan")).toBeInTheDocument();
    });
  });

  describe("tampilan konten", () => {
    it("menampilkan deskripsi, penulis, jumlah suka, dan jumlah komentar", async () => {
      await renderLoaded(basePost);

      expect(screen.getByText("Isi postingan lengkap")).toBeInTheDocument();
      expect(screen.getByText("rouli")).toBeInTheDocument();
      expect(screen.getByText("R")).toBeInTheDocument(); // inisial avatar
      expect(screen.getByRole("button", { name: /2 Suka/ })).toBeInTheDocument();
      expect(screen.getByText("Komentar (2)")).toBeInTheDocument();
      expect(screen.getByText("Komentar pertama")).toBeInTheDocument();
      expect(screen.getByText("Komentar kedua")).toBeInTheDocument();
      expect(screen.queryByText("Belum ada komentar")).not.toBeInTheDocument();
    });

    it("menampilkan gambar cover jika ada, dan tidak jika tidak ada", async () => {
      const { container, unmount } = await renderLoaded({
        ...basePost,
        cover: "https://img.test/cover.png",
      });
      expect(container.querySelector('img[src="https://img.test/cover.png"]')).toBeInTheDocument();
      unmount();

      const second = await renderLoaded(basePost);
      expect(second.container.querySelector("img")).not.toBeInTheDocument();
    });

    it("menampilkan foto penulis jika ada", async () => {
      const { container } = await renderLoaded({
        ...basePost,
        author: { name: "Budi", photo: "https://img.test/budi.png" },
      });

      expect(container.querySelector('img[src="https://img.test/budi.png"]')).toBeInTheDocument();
      expect(screen.queryByText("B")).not.toBeInTheDocument();
    });

    it("tanpa author: memakai nama 'Pengguna' dan inisial 'U'", async () => {
      await renderLoaded({ ...basePost, author: undefined });

      expect(screen.getByText("Pengguna")).toBeInTheDocument();
      expect(screen.getByText("U")).toBeInTheDocument();
    });

    it("author dengan nama kosong: inisial fallback 'U'", async () => {
      await renderLoaded({ ...basePost, author: { name: "" } });

      expect(screen.getByText("U")).toBeInTheDocument();
    });

    it("likes dan comments tidak ada: 0 suka, 0 komentar, dan pesan kosong", async () => {
      await renderLoaded({
        ...basePost,
        likes: undefined,
        comments: undefined,
      });

      expect(screen.getByRole("button", { name: /0 Suka/ })).toBeInTheDocument();
      expect(screen.getByText("Komentar (0)")).toBeInTheDocument();
      expect(screen.getByText("Belum ada komentar")).toBeInTheDocument();
    });

    it("comments berupa daftar ID angka atau entri tidak valid disaring", async () => {
      await renderLoaded({
        ...basePost,
        comments: [1, 2, null, { id: 99 }, { id: 5, comment: "Valid" }] as never,
      });

      expect(screen.getByText("Komentar (1)")).toBeInTheDocument();
      expect(screen.getByText("Valid")).toBeInTheDocument();
    });

    it("my_comment yang juga ada di daftar comments tidak ditampilkan dobel dan dihitung sekali", async () => {
      await renderLoaded({
        ...basePost,
        comments: [
          { id: 1, comment: "Komentar pertama" },
          { id: 8, comment: "Komentar saya sendiri" },
        ],
        my_comment: { id: 8, comment: "Komentar saya sendiri" },
      });

      expect(screen.getByText("Komentar (2)")).toBeInTheDocument();
      expect(screen.getAllByText("Komentar saya sendiri")).toHaveLength(1);
      expect(screen.getByText("Komentar Anda")).toBeInTheDocument();
    });

    it("my_comment yang tidak ada di daftar comments tetap dihitung", async () => {
      await renderLoaded({
        ...basePost,
        my_comment: { id: 8, comment: "Komentar saya sendiri" },
      });

      expect(screen.getByText("Komentar (3)")).toBeInTheDocument();
    });

    it("data postingan dibersihkan dari store saat halaman ditutup", async () => {
      const { store, unmount } = await renderLoaded(basePost);
      expect(store.getState().posts.post).not.toBeNull();

      unmount();

      expect(store.getState().posts.post).toBeNull();
    });

    it("menampilkan 'Komentar Anda' dan menyembunyikan pesan kosong saat my_comment ada", async () => {
      await renderLoaded({
        ...basePost,
        comments: [],
        my_comment: { id: 8, comment: "Komentar saya sendiri" },
      });

      expect(screen.getByText("Komentar Anda")).toBeInTheDocument();
      expect(screen.getByText("Komentar saya sendiri")).toBeInTheDocument();
      expect(screen.queryByText("Belum ada komentar")).not.toBeInTheDocument();
    });
  });

  describe("kepemilikan", () => {
    it("pemilik: tombol Ubah, Cover, dan Hapus tampil", async () => {
      await renderLoaded(basePost);

      expect(screen.getByRole("button", { name: "Ubah" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cover" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Hapus" })).toBeInTheDocument();
    });

    it("bukan pemilik: tombol pengelolaan tidak tampil", async () => {
      await renderLoaded({ ...basePost, user_id: 99 });

      expect(screen.queryByRole("button", { name: "Ubah" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Cover" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Hapus" })).not.toBeInTheDocument();
    });

    it("profil belum termuat (null): bukan pemilik dan belum menyukai", async () => {
      await renderLoaded(basePost, null);

      expect(screen.queryByRole("button", { name: "Ubah" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /2 Suka/ }).className).not.toContain("text-red-500 ");
    });
  });

  describe("navigasi", () => {
    it("tombol Kembali memanggil router.back", async () => {
      await renderLoaded(basePost);

      await userEvent.click(screen.getByRole("button", { name: /Kembali/ }));

      expect(nav.router.back).toHaveBeenCalledTimes(1);
    });
  });

  describe("suka", () => {
    it("belum menyukai: mengirim like=1 lalu memuat ulang detail", async () => {
      api.likePostApi.mockResolvedValue(ok);
      await renderLoaded(basePost);
      api.getDetailPostApi.mockClear();

      await userEvent.click(screen.getByRole("button", { name: /2 Suka/ }));

      await waitFor(() => expect(api.getDetailPostApi).toHaveBeenCalledWith("7"));
      expect(api.likePostApi).toHaveBeenCalledWith(7, 1);
    });

    it("sudah menyukai: mengirim like=0 (batal suka)", async () => {
      api.likePostApi.mockResolvedValue(ok);
      await renderLoaded({ ...basePost, likes: [1, 2] });
      api.getDetailPostApi.mockClear();

      const button = screen.getByRole("button", { name: /2 Suka/ });
      expect(button.className).toContain("text-red-500");
      await userEvent.click(button);

      await waitFor(() => expect(api.getDetailPostApi).toHaveBeenCalled());
      expect(api.likePostApi).toHaveBeenCalledWith(7, 0);
    });

    it("gagal like: dialog error tampil dan detail tetap dimuat ulang", async () => {
      api.likePostApi.mockRejectedValue(new Error("Gagal like"));
      await renderLoaded(basePost);
      api.getDetailPostApi.mockClear();

      await userEvent.click(screen.getByRole("button", { name: /2 Suka/ }));

      await waitFor(() => expect(showErrorDialog).toHaveBeenCalledWith("Gagal like"));
      await waitFor(() => expect(api.getDetailPostApi).toHaveBeenCalled());
    });
  });

  describe("komentar", () => {
    it("menambah komentar: mengirim teks ter-trim, mengosongkan input, memuat ulang", async () => {
      api.addCommentApi.mockResolvedValue(ok);
      await renderLoaded(basePost);
      api.getDetailPostApi.mockClear();
      const input = screen.getByPlaceholderText("Tulis komentar...");

      await userEvent.type(input, "  Mantap  {enter}");

      await waitFor(() => expect(api.getDetailPostApi).toHaveBeenCalled());
      expect(api.addCommentApi).toHaveBeenCalledWith(7, "Mantap");
      expect(input).toHaveValue("");
    });

    it("komentar kosong / spasi saja tidak dikirim", async () => {
      await renderLoaded(basePost);
      const input = screen.getByPlaceholderText("Tulis komentar...");
      const form = input.closest("form") as HTMLFormElement;

      fireEvent.submit(form);
      await userEvent.type(input, "   ");
      fireEvent.submit(form);

      expect(api.addCommentApi).not.toHaveBeenCalled();
    });

    it("gagal menambah komentar: input dipertahankan dan tidak memuat ulang", async () => {
      api.addCommentApi.mockRejectedValue(new Error("Gagal komentar"));
      await renderLoaded(basePost);
      api.getDetailPostApi.mockClear();
      const input = screen.getByPlaceholderText("Tulis komentar...");

      await userEvent.type(input, "Halo{enter}");

      await waitFor(() => expect(showErrorDialog).toHaveBeenCalledWith("Gagal komentar"));
      expect(input).toHaveValue("Halo");
      expect(api.getDetailPostApi).not.toHaveBeenCalled();
    });

    it("menghapus komentar sendiri: konfirmasi ya -> API dipanggil lalu memuat ulang", async () => {
      api.deleteCommentApi.mockResolvedValue(ok);
      await renderLoaded({
        ...basePost,
        my_comment: { id: 8, comment: "Komentar saya" },
      });
      api.getDetailPostApi.mockClear();

      await userEvent.click(screen.getByTitle("Hapus komentar"));

      await waitFor(() => expect(api.getDetailPostApi).toHaveBeenCalledWith("7"));
      expect(api.deleteCommentApi).toHaveBeenCalledWith(7);
    });

    it("menghapus komentar: konfirmasi batal -> tidak ada permintaan dan tidak memuat ulang", async () => {
      vi.mocked(showConfirmDialog).mockResolvedValue(false);
      await renderLoaded({
        ...basePost,
        my_comment: { id: 8, comment: "Komentar saya" },
      });
      api.getDetailPostApi.mockClear();

      await userEvent.click(screen.getByTitle("Hapus komentar"));

      await waitFor(() => expect(showConfirmDialog).toHaveBeenCalled());
      expect(api.deleteCommentApi).not.toHaveBeenCalled();
      expect(api.getDetailPostApi).not.toHaveBeenCalled();
    });
  });

  describe("hapus postingan", () => {
    it("konfirmasi ya: API dipanggil lalu diarahkan ke beranda", async () => {
      api.deletePostApi.mockResolvedValue(ok);
      await renderLoaded(basePost);

      await userEvent.click(screen.getByRole("button", { name: "Hapus" }));

      await waitFor(() => expect(nav.router.replace).toHaveBeenCalledWith("/"));
      expect(api.deletePostApi).toHaveBeenCalledWith(7);
    });

    it("konfirmasi batal: tidak menghapus dan tidak berpindah halaman", async () => {
      vi.mocked(showConfirmDialog).mockResolvedValue(false);
      await renderLoaded(basePost);

      await userEvent.click(screen.getByRole("button", { name: "Hapus" }));

      await waitFor(() => expect(showConfirmDialog).toHaveBeenCalled());
      expect(api.deletePostApi).not.toHaveBeenCalled();
      expect(nav.router.replace).not.toHaveBeenCalled();
    });
  });

  describe("modal ubah deskripsi & cover", () => {
    it("tombol Ubah membuka modal berisi deskripsi saat ini; simpan memuat ulang detail", async () => {
      api.updatePostApi.mockResolvedValue(ok);
      await renderLoaded(basePost);
      api.getDetailPostApi.mockClear();

      await userEvent.click(screen.getByRole("button", { name: "Ubah" }));
      expect(screen.getByText("Ubah Postingan")).toBeInTheDocument();
      const textarea = screen.getByDisplayValue("Isi postingan lengkap");

      await userEvent.clear(textarea);
      await userEvent.type(textarea, "Deskripsi baru");
      await userEvent.click(screen.getByRole("button", { name: "Simpan" }));

      await waitFor(() => expect(api.updatePostApi).toHaveBeenCalledWith(7, "Deskripsi baru"));
      await waitFor(() => expect(api.getDetailPostApi).toHaveBeenCalledWith("7"));
      await waitFor(() =>
        expect(screen.queryByText("Ubah Postingan")).not.toBeInTheDocument()
      );
    });

    it("menutup modal ubah lewat tombol Batal", async () => {
      await renderLoaded(basePost);

      await userEvent.click(screen.getByRole("button", { name: "Ubah" }));
      await userEvent.click(screen.getByRole("button", { name: "Batal" }));

      expect(screen.queryByText("Ubah Postingan")).not.toBeInTheDocument();
    });

    it("tombol Cover membuka modal cover; Batal menutupnya", async () => {
      await renderLoaded(basePost);

      await userEvent.click(screen.getByRole("button", { name: "Cover" }));
      expect(screen.getByText("Ubah Cover")).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "Batal" }));
      expect(screen.queryByText("Ubah Cover")).not.toBeInTheDocument();
    });

    it("unggah cover berhasil: memuat ulang detail dan menutup modal", async () => {
      Object.defineProperty(URL, "createObjectURL", {
        configurable: true,
        writable: true,
        value: vi.fn(() => "blob:x"),
      });
      api.changeCoverPostApi.mockResolvedValue(ok);
      const { container } = await renderLoaded(basePost);
      api.getDetailPostApi.mockClear();
      const file = new File(["x"], "c.png", { type: "image/png" });

      await userEvent.click(screen.getByRole("button", { name: "Cover" }));
      await userEvent.upload(
        container.querySelector('input[type="file"]') as HTMLInputElement,
        file
      );
      await userEvent.click(screen.getByRole("button", { name: "Unggah" }));

      await waitFor(() => expect(api.changeCoverPostApi).toHaveBeenCalledWith(7, file));
      await waitFor(() => expect(api.getDetailPostApi).toHaveBeenCalledWith("7"));
      await waitFor(() =>
        expect(screen.queryByText("Ubah Cover")).not.toBeInTheDocument()
      );
      // @ts-expect-error - membersihkan stub
      delete URL.createObjectURL;
    });
  });
});
