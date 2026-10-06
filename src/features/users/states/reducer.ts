import { createSlice } from "@reduxjs/toolkit";
import {
  asyncGetUsers,
  asyncGetProfile,
  asyncChangeProfile,
  asyncChangeProfilePhoto,
  asyncChangeProfilePassword,
} from "./action";
import type { User } from "@/types";

interface UsersState {
  users: User[];
  profile: User | null;
  isProfile: boolean;
  isChangeProfile: boolean;
  isChangeProfilePhoto: boolean;
  isChangeProfilePassword: boolean;
}

const initialState: UsersState = {
  users: [],
  profile: null,
  isProfile: false,
  isChangeProfile: false,
  isChangeProfilePhoto: false,
  isChangeProfilePassword: false,
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearProfile(state) {
      state.profile = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(asyncGetUsers.fulfilled, (state, action) => {
        state.users = action.payload;
      })
      .addCase(asyncGetProfile.pending, (state) => {
        state.isProfile = true;
      })
      .addCase(asyncGetProfile.fulfilled, (state, action) => {
        state.isProfile = false;
        state.profile = action.payload;
      })
      .addCase(asyncGetProfile.rejected, (state) => {
        state.isProfile = false;
      })
      .addCase(asyncChangeProfile.pending, (state) => {
        state.isChangeProfile = true;
      })
      .addCase(asyncChangeProfile.fulfilled, (state, action) => {
        state.isChangeProfile = false;
        if (action.payload) state.profile = action.payload;
      })
      .addCase(asyncChangeProfile.rejected, (state) => {
        state.isChangeProfile = false;
      })
      .addCase(asyncChangeProfilePhoto.pending, (state) => {
        state.isChangeProfilePhoto = true;
      })
      .addCase(asyncChangeProfilePhoto.fulfilled, (state) => {
        state.isChangeProfilePhoto = false;
      })
      .addCase(asyncChangeProfilePhoto.rejected, (state) => {
        state.isChangeProfilePhoto = false;
      })
      .addCase(asyncChangeProfilePassword.pending, (state) => {
        state.isChangeProfilePassword = true;
      })
      .addCase(asyncChangeProfilePassword.fulfilled, (state) => {
        state.isChangeProfilePassword = false;
      })
      .addCase(asyncChangeProfilePassword.rejected, (state) => {
        state.isChangeProfilePassword = false;
      });
  },
});

export const { clearProfile } = usersSlice.actions;
export default usersSlice.reducer;
