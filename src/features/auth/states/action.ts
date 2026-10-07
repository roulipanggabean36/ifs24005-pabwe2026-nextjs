import { createAsyncThunk } from "@reduxjs/toolkit";
import { loginApi, registerApi, logoutApi } from "../api/authApi";
import { showErrorDialog, showSuccessDialog } from "@/helpers/toolsHelper";
import { putAccessToken } from "@/helpers/apiHelper";

export const asyncLogin = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const result = await loginApi(email, password);
      await showSuccessDialog(result.message || "Berhasil login");
      return result.data;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal login";
      await showErrorDialog(message);
      return rejectWithValue(message);
    }
  }
);

export const asyncRegister = createAsyncThunk(
  "auth/register",
  async (
    {
      name,
      email,
      password,
    }: { name: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const result = await registerApi(name, email, password);
      await showSuccessDialog(result.message || "Berhasil registrasi");
      return result;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal registrasi";
      await showErrorDialog(message);
      return rejectWithValue(message);
    }
  }
);

export const asyncLogout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await logoutApi();
      putAccessToken(null);
      return true;
    } catch (error: unknown) {
      putAccessToken(null);
      const message =
        error instanceof Error ? error.message : "Gagal logout";
      return rejectWithValue(message);
    }
  }
);
