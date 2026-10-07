import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAllPostsApi,
  getDetailPostApi,
  addPostApi,
  updatePostApi,
  changeCoverPostApi,
  deletePostApi,
  likePostApi,
  addCommentApi,
  deleteCommentApi,
  deleteAllPostsApi,
} from "../api/postApi";
import { showConfirmDialog, showErrorDialog, showSuccessDialog } from "@/helpers/toolsHelper";

export const asyncGetPosts = createAsyncThunk(
  "posts/getPosts",
  async (isMe: boolean | undefined, { rejectWithValue }) => {
    try {
      const result = await getAllPostsApi(isMe);
      return result.data?.posts ?? [];
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal mengambil postingan";
      return rejectWithValue(message);
    }
  }
);

export const asyncGetDetailPost = createAsyncThunk(
  "posts/getDetailPost",
  async (id: number | string, { rejectWithValue }) => {
    try {
      const result = await getDetailPostApi(id);
      return result.data?.post ?? null;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal mengambil detail";
      return rejectWithValue(message);
    }
  }
);

export const asyncAddPost = createAsyncThunk(
  "posts/addPost",
  async (description: string, { rejectWithValue }) => {
    try {
      const result = await addPostApi(description);
      await showSuccessDialog(result.message || "Postingan berhasil ditambah");
      return result.data?.post_id;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal menambah postingan";
      await showErrorDialog(message);
      return rejectWithValue(message);
    }
  }
);

export const asyncChangePost = createAsyncThunk(
  "posts/changePost",
  async (
    { id, description }: { id: number | string; description: string },
    { rejectWithValue }
  ) => {
    try {
      const result = await updatePostApi(id, description);
      await showSuccessDialog(result.message || "Postingan berhasil diubah");
      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal mengubah postingan";
      await showErrorDialog(message);
      return rejectWithValue(message);
    }
  }
);

export const asyncChangeCoverPost = createAsyncThunk(
  "posts/changeCoverPost",
  async (
    { id, file }: { id: number | string; file: File },
    { rejectWithValue }
  ) => {
    try {
      const result = await changeCoverPostApi(id, file);
      await showSuccessDialog(result.message || "Cover berhasil diubah");
      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal mengubah cover";
      await showErrorDialog(message);
      return rejectWithValue(message);
    }
  }
);

export const asyncDeletePost = createAsyncThunk(
  "posts/deletePost",
  async (id: number | string, { rejectWithValue }) => {
    try {
      const confirmed = await showConfirmDialog(
        "Yakin ingin menghapus postingan ini?"
      );
      if (!confirmed) return rejectWithValue("Dibatalkan");
      const result = await deletePostApi(id);
      await showSuccessDialog(result.message || "Postingan berhasil dihapus");
      return id;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal menghapus postingan";
      if (message !== "Dibatalkan") await showErrorDialog(message);
      return rejectWithValue(message);
    }
  }
);

export const asyncLikePost = createAsyncThunk(
  "posts/likePost",
  async (
    { id, like }: { id: number | string; like: 0 | 1 },
    { rejectWithValue }
  ) => {
    try {
      await likePostApi(id, like);
      return { id, like };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal mengubah like";
      await showErrorDialog(message);
      return rejectWithValue(message);
    }
  }
);

export const asyncAddComment = createAsyncThunk(
  "posts/addComment",
  async (
    { id, comment }: { id: number | string; comment: string },
    { rejectWithValue }
  ) => {
    try {
      const result = await addCommentApi(id, comment);
      await showSuccessDialog(result.message || "Komentar berhasil ditambah");
      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal menambah komentar";
      await showErrorDialog(message);
      return rejectWithValue(message);
    }
  }
);

export const asyncDeleteComment = createAsyncThunk(
  "posts/deleteComment",
  async (id: number | string, { rejectWithValue }) => {
    try {
      const confirmed = await showConfirmDialog(
        "Yakin ingin menghapus komentar Anda?"
      );
      if (!confirmed) return rejectWithValue("Dibatalkan");
      const result = await deleteCommentApi(id);
      await showSuccessDialog(result.message || "Komentar berhasil dihapus");
      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal menghapus komentar";
      if (message !== "Dibatalkan") await showErrorDialog(message);
      return rejectWithValue(message);
    }
  }
);

export const asyncDeleteAllPosts = createAsyncThunk(
  "posts/deleteAllPosts",
  async (_, { rejectWithValue }) => {
    try {
      const confirmed = await showConfirmDialog(
        "Yakin ingin menghapus SEMUA postingan Anda? Tindakan ini tidak dapat dibatalkan."
      );
      if (!confirmed) return rejectWithValue("Dibatalkan");
      const result = await deleteAllPostsApi();
      await showSuccessDialog(result.message || "Semua postingan dihapus");
      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal menghapus semua post";
      if (message !== "Dibatalkan") await showErrorDialog(message);
      return rejectWithValue(message);
    }
  }
);
