import { describe, it, expect, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./reducer";
import { asyncLogin, asyncRegister, asyncLogout } from "./action";
import { loginApi, registerApi, logoutApi } from "../api/authApi";
import { showErrorDialog, showSuccessDialog } from "@/helpers/toolsHelper";
import { putAccessToken } from "@/helpers/apiHelper";

vi.mock("../api/authApi", () => ({
  loginApi: vi.fn(),
  registerApi: vi.fn(),
  logoutApi: vi.fn(),
}));

vi.mock("@/helpers/toolsHelper", () => ({
  showSuccessDialog: vi.fn(),
  showErrorDialog: vi.fn(),
  showConfirmDialog: vi.fn(),
}));

vi.mock("@/helpers/apiHelper", () => ({
  putAccessToken: vi.fn(),
  getAccessToken: vi.fn(),
  fetchApi: vi.fn(),
}));

function makeStore() {
  return configureStore({ reducer: { auth: authReducer } });
}

const user = { id: 1, name: "Rouli", email: "rouli@del.ac.id" };

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(showSuccessDialog).mockResolvedValue(undefined as never);
    vi.mocked(showErrorDialog).mockResolvedValue(undefined as never);
  });

  describe("asyncLogin", () => {
    it("fulfilled: menampilkan pesan dari server dan menyimpan user", async () => {
      vi.mocked(loginApi).mockResolvedValue({
        status: "success",
        message: "Login sukses",
        data: { user, token: "tok" },
      });
      const store = makeStore();

      const result = await store.dispatch(
        asyncLogin({ email: "rouli@del.ac.id", password: "pw" })
      );

      expect(loginApi).toHaveBeenCalledWith("rouli@del.ac.id", "pw");
      expect(showSuccessDialog).toHaveBeenCalledWith("Login sukses");
      expect(asyncLogin.fulfilled.match(result)).toBe(true);
      expect(store.getState().auth.authUser).toEqual(user);
      expect(store.getState().auth.isAuthLogin).toBe(false);
    });

    it("fulfilled: memakai pesan default jika server tidak mengirim message", async () => {
      vi.mocked(loginApi).mockResolvedValue({
        status: "success",
        message: "",
        data: { user, token: "tok" },
      });

      await makeStore().dispatch(asyncLogin({ email: "a@b.com", password: "pw" }));

      expect(showSuccessDialog).toHaveBeenCalledWith("Berhasil login");
    });

    it("rejected: error bertipe Error -> dialog & rejectWithValue memakai message-nya", async () => {
      vi.mocked(loginApi).mockRejectedValue(new Error("Sandi salah"));
      const store = makeStore();

      const result = await store.dispatch(
        asyncLogin({ email: "a@b.com", password: "x" })
      );

      expect(showErrorDialog).toHaveBeenCalledWith("Sandi salah");
      expect(asyncLogin.rejected.match(result)).toBe(true);
      expect(result.payload).toBe("Sandi salah");
      expect(store.getState().auth.authUser).toBeNull();
      expect(store.getState().auth.isAuthLogin).toBe(false);
    });

    it("rejected: error bukan Error -> memakai pesan default 'Gagal login'", async () => {
      vi.mocked(loginApi).mockRejectedValue("bukan instance Error");

      const result = await makeStore().dispatch(
        asyncLogin({ email: "a@b.com", password: "x" })
      );

      expect(showErrorDialog).toHaveBeenCalledWith("Gagal login");
      expect(result.payload).toBe("Gagal login");
    });
  });

  describe("asyncRegister", () => {
    it("fulfilled: menampilkan pesan dari server", async () => {
      vi.mocked(registerApi).mockResolvedValue({
        status: "success",
        message: "Registrasi sukses",
      });
      const store = makeStore();

      const result = await store.dispatch(
        asyncRegister({ name: "Rouli", email: "a@b.com", password: "pw1234" })
      );

      expect(registerApi).toHaveBeenCalledWith("Rouli", "a@b.com", "pw1234");
      expect(showSuccessDialog).toHaveBeenCalledWith("Registrasi sukses");
      expect(asyncRegister.fulfilled.match(result)).toBe(true);
      expect(store.getState().auth.isAuthRegister).toBe(false);
    });

    it("fulfilled: memakai pesan default jika message kosong", async () => {
      vi.mocked(registerApi).mockResolvedValue({ status: "success", message: "" });

      await makeStore().dispatch(
        asyncRegister({ name: "R", email: "a@b.com", password: "pw1234" })
      );

      expect(showSuccessDialog).toHaveBeenCalledWith("Berhasil registrasi");
    });

    it("rejected: error bertipe Error", async () => {
      vi.mocked(registerApi).mockRejectedValue(new Error("Email sudah dipakai"));
      const store = makeStore();

      const result = await store.dispatch(
        asyncRegister({ name: "R", email: "a@b.com", password: "pw1234" })
      );

      expect(showErrorDialog).toHaveBeenCalledWith("Email sudah dipakai");
      expect(asyncRegister.rejected.match(result)).toBe(true);
      expect(result.payload).toBe("Email sudah dipakai");
      expect(store.getState().auth.isAuthRegister).toBe(false);
    });

    it("rejected: error bukan Error -> pesan default 'Gagal registrasi'", async () => {
      vi.mocked(registerApi).mockRejectedValue(42);

      const result = await makeStore().dispatch(
        asyncRegister({ name: "R", email: "a@b.com", password: "pw1234" })
      );

      expect(showErrorDialog).toHaveBeenCalledWith("Gagal registrasi");
      expect(result.payload).toBe("Gagal registrasi");
    });
  });

  describe("asyncLogout", () => {
    it("fulfilled: memanggil API, menghapus token, dan mengosongkan authUser", async () => {
      vi.mocked(logoutApi).mockResolvedValue(undefined);
      const store = configureStore({
        reducer: { auth: authReducer },
        preloadedState: {
          auth: {
            isAuthLogin: false,
            isAuthRegister: false,
            isAuthLogout: false,
            authUser: user,
          },
        },
      });

      const result = await store.dispatch(asyncLogout());

      expect(logoutApi).toHaveBeenCalledTimes(1);
      expect(putAccessToken).toHaveBeenCalledWith(null);
      expect(asyncLogout.fulfilled.match(result)).toBe(true);
      expect(result.payload).toBe(true);
      expect(store.getState().auth.authUser).toBeNull();
      expect(store.getState().auth.isAuthLogout).toBe(false);
    });

    it("rejected: token tetap dihapus dan payload memakai message Error", async () => {
      vi.mocked(logoutApi).mockRejectedValue(new Error("Token kedaluwarsa"));
      const store = makeStore();

      const result = await store.dispatch(asyncLogout());

      expect(putAccessToken).toHaveBeenCalledWith(null);
      expect(asyncLogout.rejected.match(result)).toBe(true);
      expect(result.payload).toBe("Token kedaluwarsa");
      expect(store.getState().auth.authUser).toBeNull();
    });

    it("rejected: error bukan Error -> pesan default 'Gagal logout'", async () => {
      vi.mocked(logoutApi).mockRejectedValue(null);

      const result = await makeStore().dispatch(asyncLogout());

      expect(putAccessToken).toHaveBeenCalledWith(null);
      expect(result.payload).toBe("Gagal logout");
    });
  });
});
