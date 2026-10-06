import { createSlice } from "@reduxjs/toolkit";
import { asyncLogin, asyncRegister, asyncLogout } from "./action";
import type { User } from "@/types";

interface AuthState {
  isAuthLogin: boolean;
  isAuthRegister: boolean;
  isAuthLogout: boolean;
  authUser: User | null;
}

const initialState: AuthState = {
  isAuthLogin: false,
  isAuthRegister: false,
  isAuthLogout: false,
  authUser: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthUser(state) {
      state.authUser = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(asyncLogin.pending, (state) => {
        state.isAuthLogin = true;
      })
      .addCase(asyncLogin.fulfilled, (state, action) => {
        state.isAuthLogin = false;
        state.authUser = action.payload?.user ?? null;
      })
      .addCase(asyncLogin.rejected, (state) => {
        state.isAuthLogin = false;
      })
      .addCase(asyncRegister.pending, (state) => {
        state.isAuthRegister = true;
      })
      .addCase(asyncRegister.fulfilled, (state) => {
        state.isAuthRegister = false;
      })
      .addCase(asyncRegister.rejected, (state) => {
        state.isAuthRegister = false;
      })
      .addCase(asyncLogout.pending, (state) => {
        state.isAuthLogout = true;
      })
      .addCase(asyncLogout.fulfilled, (state) => {
        state.isAuthLogout = false;
        state.authUser = null;
      })
      .addCase(asyncLogout.rejected, (state) => {
        state.isAuthLogout = false;
        state.authUser = null;
      });
  },
});

export const { clearAuthUser } = authSlice.actions;
export default authSlice.reducer;
