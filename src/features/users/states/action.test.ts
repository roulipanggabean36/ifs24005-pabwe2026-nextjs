import { describe, it, expect, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import usersReducer from "./reducer";
import {
  asyncGetUsers,
  asyncGetProfile,
  asyncChangeProfile,
  asyncChangeProfilePhoto,
  asyncChangeProfilePassword,
} from "./action";
import * as userApi from "../api/userApi";
import { showErrorDialog, showSuccessDialog } from "@/helpers/toolsHelper";

vi.mock("../api/userApi", () => ({
  getAllUsersApi: vi.fn(),
  getProfileApi: vi.fn(),
  updateProfileApi: vi.fn(),
  changePhotoApi: vi.fn(),
  changePasswordApi: vi.fn(),
}));

vi.mock("@/helpers/toolsHelper", () => ({
  showSuccessDialog: vi.fn(),
  showErrorDialog: vi.fn(),
  showConfirmDialog: vi.fn(),
}));

const api = vi.mocked(userApi);

function makeStore() {
  return configureStore({ reducer: { users: usersReducer } });
}

const user = { id: 1, name: "Rouli", email: "rouli@del.ac.id" };
const ok = { status: "success" as const, message: "Pesan server" };
const okNoMessage = { status: "success" as const, message: "" };
const passwordPayload = {
  password: "lama123",
  new_password: "baru1234",
  new_password_confirmation: "baru1234",
};

describe("users actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(showSuccessDialog).mockResolvedValue(undefined as never);
    vi.mocked(showErrorDialog).mockResolvedValue(undefined as never);
  });

  describe("asyncGetUsers", () => {
    it("fulfilled: mengembalikan daftar pengguna dan menyimpannya ke store", async () => {
      api.getAllUsersApi.mockResolvedValue({ ...ok, data: { users: [user] } });
      const store = makeStore();

      const result = await store.dispatch(asyncGetUsers());

      expect(api.getAllUsersApi).toHaveBeenCalledTimes(1);
      expect(asyncGetUsers.fulfilled.match(result)).toBe(true);
      expect(store.getState().users.users).toEqual([user]);
    });

    it("fulfilled: data kosong -> array kosong", async () => {
      api.getAllUsersApi.mockResolvedValue(ok);

      const result = await makeStore().dispatch(asyncGetUsers());

      expect(result.payload).toEqual([]);
    });

    it("rejected: error bertipe Error -> payload memakai message-nya (tanpa dialog)", async () => {
      api.getAllUsersApi.mockRejectedValue(new Error("Jaringan putus"));

      const result = await makeStore().dispatch(asyncGetUsers());

      expect(asyncGetUsers.rejected.match(result)).toBe(true);
      expect(result.payload).toBe("Jaringan putus");
      expect(showErrorDialog).not.toHaveBeenCalled();
    });

    it("rejected: error bukan Error -> pesan default", async () => {
      api.getAllUsersApi.mockRejectedValue("x");

      const result = await makeStore().dispatch(asyncGetUsers());

      expect(result.payload).toBe("Gagal mengambil pengguna");
    });
  });

  describe("asyncGetProfile", () => {
    it("fulfilled: mengembalikan profil dan menyimpannya", async () => {
      api.getProfileApi.mockResolvedValue({ ...ok, data: { user } });
      const store = makeStore();

      const result = await store.dispatch(asyncGetProfile());

      expect(result.payload).toEqual(user);
      expect(store.getState().users.profile).toEqual(user);
      expect(store.getState().users.isProfile).toBe(false);
    });

    it("fulfilled: data kosong -> null", async () => {
      api.getProfileApi.mockResolvedValue(ok);

      const result = await makeStore().dispatch(asyncGetProfile());

      expect(result.payload).toBeNull();
    });

    it("rejected: error bertipe Error", async () => {
      api.getProfileApi.mockRejectedValue(new Error("Unauthorized"));
      const store = makeStore();

      const result = await store.dispatch(asyncGetProfile());

      expect(asyncGetProfile.rejected.match(result)).toBe(true);
      expect(result.payload).toBe("Unauthorized");
      expect(store.getState().users.isProfile).toBe(false);
      expect(showErrorDialog).not.toHaveBeenCalled();
    });

    it("rejected: error bukan Error -> pesan default", async () => {
      api.getProfileApi.mockRejectedValue(undefined);

      const result = await makeStore().dispatch(asyncGetProfile());

      expect(result.payload).toBe("Gagal mengambil profil");
    });
  });

  describe("asyncChangeProfile", () => {
    it("fulfilled: menampilkan pesan server dan memperbarui profil di store", async () => {
      const updated = { ...user, name: "Rouli Baru" };
      api.updateProfileApi.mockResolvedValue({ ...ok, data: { user: updated } });
      const store = makeStore();

      const result = await store.dispatch(
        asyncChangeProfile({ name: "Rouli Baru", email: user.email })
      );

      expect(api.updateProfileApi).toHaveBeenCalledWith("Rouli Baru", user.email);
      expect(showSuccessDialog).toHaveBeenCalledWith("Pesan server");
      expect(result.payload).toEqual(updated);
      expect(store.getState().users.profile).toEqual(updated);
    });

    it("fulfilled: pesan default & data kosong -> payload null (profil tidak berubah)", async () => {
      api.updateProfileApi.mockResolvedValue(okNoMessage);
      const store = configureStore({
        reducer: { users: usersReducer },
        preloadedState: {
          users: { ...usersReducer(undefined, { type: "@@INIT" }), profile: user },
        },
      });

      const result = await store.dispatch(
        asyncChangeProfile({ name: "X", email: "x@x.com" })
      );

      expect(showSuccessDialog).toHaveBeenCalledWith("Profil berhasil diubah");
      expect(result.payload).toBeNull();
      expect(store.getState().users.profile).toEqual(user);
    });

    it("rejected: error bertipe Error -> dialog error", async () => {
      api.updateProfileApi.mockRejectedValue(new Error("Email sudah dipakai"));
      const store = makeStore();

      const result = await store.dispatch(
        asyncChangeProfile({ name: "X", email: "x@x.com" })
      );

      expect(showErrorDialog).toHaveBeenCalledWith("Email sudah dipakai");
      expect(result.payload).toBe("Email sudah dipakai");
      expect(store.getState().users.isChangeProfile).toBe(false);
    });

    it("rejected: error bukan Error -> pesan default", async () => {
      api.updateProfileApi.mockRejectedValue(0);

      const result = await makeStore().dispatch(
        asyncChangeProfile({ name: "X", email: "x@x.com" })
      );

      expect(showErrorDialog).toHaveBeenCalledWith("Gagal mengubah profil");
      expect(result.payload).toBe("Gagal mengubah profil");
    });
  });

  describe("asyncChangeProfilePhoto", () => {
    const file = new File(["x"], "foto.png", { type: "image/png" });

    it("fulfilled: pesan server", async () => {
      api.changePhotoApi.mockResolvedValue(ok);
      const store = makeStore();

      const result = await store.dispatch(asyncChangeProfilePhoto(file));

      expect(api.changePhotoApi).toHaveBeenCalledWith(file);
      expect(showSuccessDialog).toHaveBeenCalledWith("Pesan server");
      expect(result.payload).toBe(true);
      expect(store.getState().users.isChangeProfilePhoto).toBe(false);
    });

    it("fulfilled: pesan default", async () => {
      api.changePhotoApi.mockResolvedValue(okNoMessage);

      await makeStore().dispatch(asyncChangeProfilePhoto(file));

      expect(showSuccessDialog).toHaveBeenCalledWith("Foto profil berhasil diubah");
    });

    it("rejected: error bertipe Error", async () => {
      api.changePhotoApi.mockRejectedValue(new Error("File terlalu besar"));

      const result = await makeStore().dispatch(asyncChangeProfilePhoto(file));

      expect(showErrorDialog).toHaveBeenCalledWith("File terlalu besar");
      expect(result.payload).toBe("File terlalu besar");
    });

    it("rejected: error bukan Error -> pesan default", async () => {
      api.changePhotoApi.mockRejectedValue(null);

      const result = await makeStore().dispatch(asyncChangeProfilePhoto(file));

      expect(showErrorDialog).toHaveBeenCalledWith("Gagal mengubah foto");
      expect(result.payload).toBe("Gagal mengubah foto");
    });
  });

  describe("asyncChangeProfilePassword", () => {
    it("fulfilled: pesan server dan argumen diteruskan berurutan", async () => {
      api.changePasswordApi.mockResolvedValue(ok);
      const store = makeStore();

      const result = await store.dispatch(
        asyncChangeProfilePassword(passwordPayload)
      );

      expect(api.changePasswordApi).toHaveBeenCalledWith(
        "lama123",
        "baru1234",
        "baru1234"
      );
      expect(showSuccessDialog).toHaveBeenCalledWith("Pesan server");
      expect(result.payload).toBe(true);
      expect(store.getState().users.isChangeProfilePassword).toBe(false);
    });

    it("fulfilled: pesan default", async () => {
      api.changePasswordApi.mockResolvedValue(okNoMessage);

      await makeStore().dispatch(asyncChangeProfilePassword(passwordPayload));

      expect(showSuccessDialog).toHaveBeenCalledWith("Kata sandi berhasil diubah");
    });

    it("rejected: error bertipe Error", async () => {
      api.changePasswordApi.mockRejectedValue(new Error("Sandi lama salah"));

      const result = await makeStore().dispatch(
        asyncChangeProfilePassword(passwordPayload)
      );

      expect(showErrorDialog).toHaveBeenCalledWith("Sandi lama salah");
      expect(result.payload).toBe("Sandi lama salah");
    });

    it("rejected: error bukan Error -> pesan default", async () => {
      api.changePasswordApi.mockRejectedValue({});

      const result = await makeStore().dispatch(
        asyncChangeProfilePassword(passwordPayload)
      );

      expect(showErrorDialog).toHaveBeenCalledWith("Gagal mengubah kata sandi");
      expect(result.payload).toBe("Gagal mengubah kata sandi");
    });
  });
});
