import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAllUsersApi,
  getProfileApi,
  updateProfileApi,
  changePhotoApi,
  changePasswordApi,
} from "../api/userApi";
import { showErrorDialog, showSuccessDialog } from "@/helpers/toolsHelper";

export const asyncGetUsers = createAsyncThunk(
  "users/getUsers",
  async (_, { rejectWithValue }) => {
    try {
      const result = await getAllUsersApi();
      return result.data?.users ?? [];
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal mengambil pengguna";
      return rejectWithValue(message);
    }
  }
);

export const asyncGetProfile = createAsyncThunk(
  "users/getProfile",
  async (_, { rejectWithValue }) => {
    try {
      const result = await getProfileApi();
      return result.data?.user ?? null;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal mengambil profil";
      return rejectWithValue(message);
    }
  }
);

export const asyncChangeProfile = createAsyncThunk(
  "users/changeProfile",
  async (
    { name, email }: { name: string; email: string },
    { rejectWithValue }
  ) => {
    try {
      const result = await updateProfileApi(name, email);
      await showSuccessDialog(result.message || "Profil berhasil diubah");
      return result.data?.user ?? null;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal mengubah profil";
      await showErrorDialog(message);
      return rejectWithValue(message);
    }
  }
);

export const asyncChangeProfilePhoto = createAsyncThunk(
  "users/changeProfilePhoto",
  async (file: File, { rejectWithValue }) => {
    try {
      const result = await changePhotoApi(file);
      await showSuccessDialog(result.message || "Foto profil berhasil diubah");
      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal mengubah foto";
      await showErrorDialog(message);
      return rejectWithValue(message);
    }
  }
);

export const asyncChangeProfilePassword = createAsyncThunk(
  "users/changeProfilePassword",
  async (
    {
      password,
      new_password,
      new_password_confirmation,
    }: {
      password: string;
      new_password: string;
      new_password_confirmation: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await changePasswordApi(
        password,
        new_password,
        new_password_confirmation
      );
      await showSuccessDialog(result.message || "Kata sandi berhasil diubah");
      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal mengubah kata sandi";
      await showErrorDialog(message);
      return rejectWithValue(message);
    }
  }
);
