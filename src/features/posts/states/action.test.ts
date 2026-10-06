import { describe, it, expect, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import postsReducer from "./reducer";
import {
  asyncGetPosts,
  asyncGetDetailPost,
  asyncAddPost,
  asyncChangePost,
  asyncChangeCoverPost,
  asyncDeletePost,
  asyncLikePost,
  asyncAddComment,
  asyncDeleteComment,
  asyncDeleteAllPosts,
} from "./action";
import * as postApi from "../api/postApi";
import {
  showConfirmDialog,
  showErrorDialog,
  showSuccessDialog,
} from "@/helpers/toolsHelper";

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

vi.mock("@/helpers/toolsHelper", () => ({
  showSuccessDialog: vi.fn(),
  showErrorDialog: vi.fn(),
  showConfirmDialog: vi.fn(),
}));

const api = vi.mocked(postApi);

function makeStore() {
  return configureStore({ reducer: { posts: postsReducer } });
}

const ok = { status: "success" as const, message: "Pesan server" };
const okNoMessage = { status: "success" as const, message: "" };
const post = { id: 1, user_id: 1, description: "Halo" };

describe("posts actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(showSuccessDialog).mockResolvedValue(undefined as never);
    vi.mocked(showErrorDialog).mockResolvedValue(undefined as never);
    vi.mocked(showConfirmDialog).mockResolvedValue(true);
  });

  describe("asyncGetPosts", () => {
    it("fulfilled: mengembalikan daftar posting dan menyimpannya ke store", async () => {
      api.getAllPostsApi.mockResolvedValue({ ...ok, data: { posts: [post] } });
      const store = makeStore();

      const result = await store.dispatch(asyncGetPosts(true));

      expect(api.getAllPostsApi).toHaveBeenCalledWith(true);
      expect(asyncGetPosts.fulfilled.match(result)).toBe(true);
      expect(store.getState().posts.posts).toEqual([post]);
      expect(store.getState().posts.isPost).toBe(false);
    });

    it("fulfilled: data kosong -> array kosong", async () => {
      api.getAllPostsApi.mockResolvedValue(ok);

      const result = await makeStore().dispatch(asyncGetPosts(undefined));

      expect(api.getAllPostsApi).toHaveBeenCalledWith(undefined);
      expect(result.payload).toEqual([]);
    });

    it("rejected: error bertipe Error", async () => {
      api.getAllPostsApi.mockRejectedValue(new Error("Jaringan putus"));

      const result = await makeStore().dispatch(asyncGetPosts(false));

      expect(asyncGetPosts.rejected.match(result)).toBe(true);
      expect(result.payload).toBe("Jaringan putus");
    });

    it("rejected: error bukan Error -> pesan default", async () => {
      api.getAllPostsApi.mockRejectedValue("x");

      const result = await makeStore().dispatch(asyncGetPosts(false));

      expect(result.payload).toBe("Gagal mengambil postingan");
    });
  });

  describe("asyncGetDetailPost", () => {
    it("fulfilled: mengembalikan post dan menyimpannya", async () => {
      api.getDetailPostApi.mockResolvedValue({ ...ok, data: { post } });
      const store = makeStore();

      const result = await store.dispatch(asyncGetDetailPost(1));

      expect(api.getDetailPostApi).toHaveBeenCalledWith(1);
      expect(result.payload).toEqual(post);
      expect(store.getState().posts.post).toEqual(post);
    });

    it("fulfilled: data kosong -> null", async () => {
      api.getDetailPostApi.mockResolvedValue(ok);

      const result = await makeStore().dispatch(asyncGetDetailPost("2"));

      expect(result.payload).toBeNull();
    });

    it("rejected: error bertipe Error", async () => {
      api.getDetailPostApi.mockRejectedValue(new Error("Tidak ditemukan"));

      const result = await makeStore().dispatch(asyncGetDetailPost(1));

      expect(asyncGetDetailPost.rejected.match(result)).toBe(true);
      expect(result.payload).toBe("Tidak ditemukan");
    });

    it("rejected: error bukan Error -> pesan default", async () => {
      api.getDetailPostApi.mockRejectedValue(undefined);

      const result = await makeStore().dispatch(asyncGetDetailPost(1));

      expect(result.payload).toBe("Gagal mengambil detail");
    });
  });

  describe("asyncAddPost", () => {
    it("fulfilled: menampilkan pesan server dan mengembalikan post_id", async () => {
      api.addPostApi.mockResolvedValue({ ...ok, data: { post_id: 9 } });
      const store = makeStore();

      const result = await store.dispatch(asyncAddPost("Isi baru"));

      expect(api.addPostApi).toHaveBeenCalledWith("Isi baru");
      expect(showSuccessDialog).toHaveBeenCalledWith("Pesan server");
      expect(result.payload).toBe(9);
      expect(store.getState().posts.isPostAdded).toBe(true);
    });

    it("fulfilled: pesan default & data kosong -> payload undefined", async () => {
      api.addPostApi.mockResolvedValue(okNoMessage);

      const result = await makeStore().dispatch(asyncAddPost("Isi"));

      expect(showSuccessDialog).toHaveBeenCalledWith("Postingan berhasil ditambah");
      expect(result.payload).toBeUndefined();
    });

    it("rejected: error bertipe Error -> dialog error", async () => {
      api.addPostApi.mockRejectedValue(new Error("Deskripsi wajib"));

      const result = await makeStore().dispatch(asyncAddPost("x"));

      expect(showErrorDialog).toHaveBeenCalledWith("Deskripsi wajib");
      expect(result.payload).toBe("Deskripsi wajib");
    });

    it("rejected: error bukan Error -> pesan default", async () => {
      api.addPostApi.mockRejectedValue(1);

      const result = await makeStore().dispatch(asyncAddPost("x"));

      expect(showErrorDialog).toHaveBeenCalledWith("Gagal menambah postingan");
      expect(result.payload).toBe("Gagal menambah postingan");
    });
  });

  describe("asyncChangePost", () => {
    it("fulfilled: pesan server", async () => {
      api.updatePostApi.mockResolvedValue(ok);
      const store = makeStore();

      const result = await store.dispatch(
        asyncChangePost({ id: 3, description: "Baru" })
      );

      expect(api.updatePostApi).toHaveBeenCalledWith(3, "Baru");
      expect(showSuccessDialog).toHaveBeenCalledWith("Pesan server");
      expect(result.payload).toBe(true);
      expect(store.getState().posts.isPostChanged).toBe(true);
    });

    it("fulfilled: pesan default", async () => {
      api.updatePostApi.mockResolvedValue(okNoMessage);

      await makeStore().dispatch(asyncChangePost({ id: 3, description: "Baru" }));

      expect(showSuccessDialog).toHaveBeenCalledWith("Postingan berhasil diubah");
    });

    it("rejected: error bertipe Error", async () => {
      api.updatePostApi.mockRejectedValue(new Error("Dilarang"));

      const result = await makeStore().dispatch(
        asyncChangePost({ id: 3, description: "Baru" })
      );

      expect(showErrorDialog).toHaveBeenCalledWith("Dilarang");
      expect(result.payload).toBe("Dilarang");
    });

    it("rejected: error bukan Error -> pesan default", async () => {
      api.updatePostApi.mockRejectedValue(null);

      const result = await makeStore().dispatch(
        asyncChangePost({ id: 3, description: "Baru" })
      );

      expect(result.payload).toBe("Gagal mengubah postingan");
    });
  });

  describe("asyncChangeCoverPost", () => {
    const file = new File(["x"], "cover.png", { type: "image/png" });

    it("fulfilled: pesan server", async () => {
      api.changeCoverPostApi.mockResolvedValue(ok);
      const store = makeStore();

      const result = await store.dispatch(asyncChangeCoverPost({ id: 4, file }));

      expect(api.changeCoverPostApi).toHaveBeenCalledWith(4, file);
      expect(showSuccessDialog).toHaveBeenCalledWith("Pesan server");
      expect(result.payload).toBe(true);
      expect(store.getState().posts.isPostChangedCover).toBe(true);
    });

    it("fulfilled: pesan default", async () => {
      api.changeCoverPostApi.mockResolvedValue(okNoMessage);

      await makeStore().dispatch(asyncChangeCoverPost({ id: 4, file }));

      expect(showSuccessDialog).toHaveBeenCalledWith("Cover berhasil diubah");
    });

    it("rejected: error bertipe Error", async () => {
      api.changeCoverPostApi.mockRejectedValue(new Error("File terlalu besar"));

      const result = await makeStore().dispatch(
        asyncChangeCoverPost({ id: 4, file })
      );

      expect(showErrorDialog).toHaveBeenCalledWith("File terlalu besar");
      expect(result.payload).toBe("File terlalu besar");
    });

    it("rejected: error bukan Error -> pesan default", async () => {
      api.changeCoverPostApi.mockRejectedValue({});

      const result = await makeStore().dispatch(
        asyncChangeCoverPost({ id: 4, file })
      );

      expect(result.payload).toBe("Gagal mengubah cover");
    });
  });

  describe("asyncDeletePost", () => {
    it("fulfilled: konfirmasi ya -> menghapus & mengembalikan id", async () => {
      api.deletePostApi.mockResolvedValue(ok);
      const store = makeStore();

      const result = await store.dispatch(asyncDeletePost(5));

      expect(showConfirmDialog).toHaveBeenCalledWith(
        "Yakin ingin menghapus postingan ini?"
      );
      expect(api.deletePostApi).toHaveBeenCalledWith(5);
      expect(showSuccessDialog).toHaveBeenCalledWith("Pesan server");
      expect(result.payload).toBe(5);
      expect(store.getState().posts.isPostDeleted).toBe(true);
    });

    it("fulfilled: pesan default", async () => {
      api.deletePostApi.mockResolvedValue(okNoMessage);

      await makeStore().dispatch(asyncDeletePost(5));

      expect(showSuccessDialog).toHaveBeenCalledWith("Postingan berhasil dihapus");
    });

    it("dibatalkan: konfirmasi tidak -> API tidak dipanggil, rejected 'Dibatalkan'", async () => {
      vi.mocked(showConfirmDialog).mockResolvedValue(false);

      const result = await makeStore().dispatch(asyncDeletePost(5));

      expect(api.deletePostApi).not.toHaveBeenCalled();
      expect(asyncDeletePost.rejected.match(result)).toBe(true);
      expect(result.payload).toBe("Dibatalkan");
      expect(showErrorDialog).not.toHaveBeenCalled();
    });

    it("rejected: error API bertipe Error -> dialog error", async () => {
      api.deletePostApi.mockRejectedValue(new Error("Gagal di server"));

      const result = await makeStore().dispatch(asyncDeletePost(5));

      expect(showErrorDialog).toHaveBeenCalledWith("Gagal di server");
      expect(result.payload).toBe("Gagal di server");
    });

    it("rejected: error bukan Error -> pesan default", async () => {
      api.deletePostApi.mockRejectedValue("x");

      const result = await makeStore().dispatch(asyncDeletePost(5));

      expect(showErrorDialog).toHaveBeenCalledWith("Gagal menghapus postingan");
      expect(result.payload).toBe("Gagal menghapus postingan");
    });

    it("rejected: Error ber-pesan 'Dibatalkan' dari API -> dialog error tidak ditampilkan", async () => {
      api.deletePostApi.mockRejectedValue(new Error("Dibatalkan"));

      const result = await makeStore().dispatch(asyncDeletePost(5));

      expect(showErrorDialog).not.toHaveBeenCalled();
      expect(result.payload).toBe("Dibatalkan");
    });
  });

  describe("asyncLikePost", () => {
    it("fulfilled: mengembalikan id dan nilai like", async () => {
      api.likePostApi.mockResolvedValue(ok);
      const store = makeStore();

      const result = await store.dispatch(asyncLikePost({ id: 6, like: 1 }));

      expect(api.likePostApi).toHaveBeenCalledWith(6, 1);
      expect(result.payload).toEqual({ id: 6, like: 1 });
      expect(store.getState().posts.isPostLiked).toBe(true);
    });

    it("rejected: error bertipe Error", async () => {
      api.likePostApi.mockRejectedValue(new Error("Tidak bisa like"));

      const result = await makeStore().dispatch(asyncLikePost({ id: 6, like: 0 }));

      expect(showErrorDialog).toHaveBeenCalledWith("Tidak bisa like");
      expect(result.payload).toBe("Tidak bisa like");
    });

    it("rejected: error bukan Error -> pesan default", async () => {
      api.likePostApi.mockRejectedValue(0);

      const result = await makeStore().dispatch(asyncLikePost({ id: 6, like: 0 }));

      expect(result.payload).toBe("Gagal mengubah like");
    });
  });

  describe("asyncAddComment", () => {
    it("fulfilled: pesan server", async () => {
      api.addCommentApi.mockResolvedValue(ok);
      const store = makeStore();

      const result = await store.dispatch(
        asyncAddComment({ id: 7, comment: "Bagus" })
      );

      expect(api.addCommentApi).toHaveBeenCalledWith(7, "Bagus");
      expect(showSuccessDialog).toHaveBeenCalledWith("Pesan server");
      expect(result.payload).toBe(true);
      expect(store.getState().posts.isPostAddedComment).toBe(true);
    });

    it("fulfilled: pesan default", async () => {
      api.addCommentApi.mockResolvedValue(okNoMessage);

      await makeStore().dispatch(asyncAddComment({ id: 7, comment: "Bagus" }));

      expect(showSuccessDialog).toHaveBeenCalledWith("Komentar berhasil ditambah");
    });

    it("rejected: error bertipe Error", async () => {
      api.addCommentApi.mockRejectedValue(new Error("Komentar kosong"));

      const result = await makeStore().dispatch(
        asyncAddComment({ id: 7, comment: "" })
      );

      expect(showErrorDialog).toHaveBeenCalledWith("Komentar kosong");
      expect(result.payload).toBe("Komentar kosong");
    });

    it("rejected: error bukan Error -> pesan default", async () => {
      api.addCommentApi.mockRejectedValue(false);

      const result = await makeStore().dispatch(
        asyncAddComment({ id: 7, comment: "x" })
      );

      expect(result.payload).toBe("Gagal menambah komentar");
    });
  });

  describe("asyncDeleteComment", () => {
    it("fulfilled: konfirmasi ya -> komentar dihapus", async () => {
      api.deleteCommentApi.mockResolvedValue(ok);
      const store = makeStore();

      const result = await store.dispatch(asyncDeleteComment(8));

      expect(showConfirmDialog).toHaveBeenCalledWith(
        "Yakin ingin menghapus komentar Anda?"
      );
      expect(api.deleteCommentApi).toHaveBeenCalledWith(8);
      expect(showSuccessDialog).toHaveBeenCalledWith("Pesan server");
      expect(result.payload).toBe(true);
      expect(store.getState().posts.isPostDeletedComment).toBe(true);
    });

    it("fulfilled: pesan default", async () => {
      api.deleteCommentApi.mockResolvedValue(okNoMessage);

      await makeStore().dispatch(asyncDeleteComment(8));

      expect(showSuccessDialog).toHaveBeenCalledWith("Komentar berhasil dihapus");
    });

    it("dibatalkan: konfirmasi tidak -> API tidak dipanggil", async () => {
      vi.mocked(showConfirmDialog).mockResolvedValue(false);

      const result = await makeStore().dispatch(asyncDeleteComment(8));

      expect(api.deleteCommentApi).not.toHaveBeenCalled();
      expect(result.payload).toBe("Dibatalkan");
      expect(showErrorDialog).not.toHaveBeenCalled();
    });

    it("rejected: error API bertipe Error -> dialog error", async () => {
      api.deleteCommentApi.mockRejectedValue(new Error("Gagal hapus komentar"));

      const result = await makeStore().dispatch(asyncDeleteComment(8));

      expect(showErrorDialog).toHaveBeenCalledWith("Gagal hapus komentar");
      expect(result.payload).toBe("Gagal hapus komentar");
    });

    it("rejected: error bukan Error -> pesan default", async () => {
      api.deleteCommentApi.mockRejectedValue("x");

      const result = await makeStore().dispatch(asyncDeleteComment(8));

      expect(result.payload).toBe("Gagal menghapus komentar");
    });

    it("rejected: Error ber-pesan 'Dibatalkan' -> dialog error tidak ditampilkan", async () => {
      api.deleteCommentApi.mockRejectedValue(new Error("Dibatalkan"));

      await makeStore().dispatch(asyncDeleteComment(8));

      expect(showErrorDialog).not.toHaveBeenCalled();
    });
  });

  describe("asyncDeleteAllPosts", () => {
    it("fulfilled: konfirmasi ya -> semua posting dikosongkan di store", async () => {
      api.deleteAllPostsApi.mockResolvedValue(ok);
      const store = configureStore({
        reducer: { posts: postsReducer },
        preloadedState: {
          posts: { ...postsReducer(undefined, { type: "@@INIT" }), posts: [post] },
        },
      });

      const result = await store.dispatch(asyncDeleteAllPosts());

      expect(showConfirmDialog).toHaveBeenCalledWith(
        "Yakin ingin menghapus SEMUA postingan Anda? Tindakan ini tidak dapat dibatalkan."
      );
      expect(api.deleteAllPostsApi).toHaveBeenCalledTimes(1);
      expect(showSuccessDialog).toHaveBeenCalledWith("Pesan server");
      expect(result.payload).toBe(true);
      expect(store.getState().posts.posts).toEqual([]);
      expect(store.getState().posts.isPostDeletedAll).toBe(true);
    });

    it("fulfilled: pesan default", async () => {
      api.deleteAllPostsApi.mockResolvedValue(okNoMessage);

      await makeStore().dispatch(asyncDeleteAllPosts());

      expect(showSuccessDialog).toHaveBeenCalledWith("Semua postingan dihapus");
    });

    it("dibatalkan: konfirmasi tidak -> API tidak dipanggil", async () => {
      vi.mocked(showConfirmDialog).mockResolvedValue(false);

      const result = await makeStore().dispatch(asyncDeleteAllPosts());

      expect(api.deleteAllPostsApi).not.toHaveBeenCalled();
      expect(result.payload).toBe("Dibatalkan");
      expect(showErrorDialog).not.toHaveBeenCalled();
    });

    it("rejected: error API bertipe Error -> dialog error", async () => {
      api.deleteAllPostsApi.mockRejectedValue(new Error("Server error"));

      const result = await makeStore().dispatch(asyncDeleteAllPosts());

      expect(showErrorDialog).toHaveBeenCalledWith("Server error");
      expect(result.payload).toBe("Server error");
    });

    it("rejected: error bukan Error -> pesan default", async () => {
      api.deleteAllPostsApi.mockRejectedValue("x");

      const result = await makeStore().dispatch(asyncDeleteAllPosts());

      expect(showErrorDialog).toHaveBeenCalledWith("Gagal menghapus semua post");
      expect(result.payload).toBe("Gagal menghapus semua post");
    });

    it("rejected: Error ber-pesan 'Dibatalkan' -> dialog error tidak ditampilkan", async () => {
      api.deleteAllPostsApi.mockRejectedValue(new Error("Dibatalkan"));

      await makeStore().dispatch(asyncDeleteAllPosts());

      expect(showErrorDialog).not.toHaveBeenCalled();
    });
  });
});
