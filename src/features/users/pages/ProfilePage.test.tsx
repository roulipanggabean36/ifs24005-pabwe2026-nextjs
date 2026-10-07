import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor, fireEvent } from "@/test-utils";
import ProfilePage from "./ProfilePage";
import usersReducer from "../states/reducer";
import * as userApi from "../api/userApi";
import { showErrorDialog, showSuccessDialog } from "@/helpers/toolsHelper";
import type { User } from "@/types";

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
const initialUsers = usersReducer(undefined, { type: "@@INIT" });
const ok = { status: "success" as const, message: "Berhasil" };

const profile: User = {
  id: 1,
  name: "rouli",
  email: "rouli@del.ac.id",
  photo: null,
};

function respondProfile(user: User | undefined = profile) {
  api.getProfileApi.mockResolvedValue({
    status: "success",
    message: "ok",
    data: user ? { user } : undefined,
  });
}

async function renderLoaded(user: User = profile) {
  respondProfile(user);
  const utils = renderWithProviders(<ProfilePage />);
  await waitFor(() =>
    expect(screen.getByDisplayValue(user.name || user.email)).toBeInTheDocument()
  );
  return utils;
}

function labelledInput(label: string) {
  return screen.getByText(label).parentElement!.querySelector("input") as HTMLInputElement;
}

function getFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(showSuccessDialog).mockResolvedValue(undefined as never);
    vi.mocked(showErrorDialog).mockResolvedValue(undefined as never);
    respondProfile();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(() => "blob:preview"),
    });
  });

  afterEach(() => {
    // @ts-expect-error - membersihkan stub
    delete URL.createObjectURL;
  });

  describe("pemuatan profil", () => {
    it("memanggil API profil saat mount dan mengisi form dengan data profil", async () => {
      await renderLoaded();

      expect(api.getProfileApi).toHaveBeenCalledTimes(1);
      expect(labelledInput("Nama")).toHaveValue("rouli");
      expect(labelledInput("Email")).toHaveValue("rouli@del.ac.id");
      expect(
        screen.getByRole("heading", { name: /Profil Saya/ })
      ).toBeInTheDocument();
    });

    it("menampilkan 'Memuat profil...' selama profil belum ada dan sedang dimuat", () => {
      api.getProfileApi.mockReturnValue(new Promise(() => {}));

      renderWithProviders(<ProfilePage />);

      expect(screen.getByText("Memuat profil...")).toBeInTheDocument();
      expect(screen.queryByText("Informasi Profil")).not.toBeInTheDocument();
    });

    it("jika profil gagal dimuat: form tetap tampil dengan field kosong dan avatar 'U'", async () => {
      api.getProfileApi.mockRejectedValue(new Error("Unauthorized"));

      renderWithProviders(<ProfilePage />);

      expect(await screen.findByText("Informasi Profil")).toBeInTheDocument();
      expect(labelledInput("Nama")).toHaveValue("");
      expect(labelledInput("Email")).toHaveValue("");
      expect(screen.getByText("U")).toBeInTheDocument();
    });

    it("profil dengan nama & email kosong: field diisi string kosong", async () => {
      respondProfile({ id: 2, name: "", email: "" });

      renderWithProviders(<ProfilePage />);

      await screen.findByText("Informasi Profil");
      await waitFor(() => expect(api.getProfileApi).toHaveBeenCalled());
      expect(labelledInput("Nama")).toHaveValue("");
      expect(labelledInput("Email")).toHaveValue("");
      expect(screen.getByText("U")).toBeInTheDocument();
    });
  });

  describe("avatar", () => {
    it("tanpa foto: menampilkan inisial kapital dari nama", async () => {
      await renderLoaded();

      expect(screen.getByText("R")).toBeInTheDocument();
      expect(screen.queryByAltText("Foto profil")).not.toBeInTheDocument();
    });

    it("dengan foto: menampilkan gambar profil", async () => {
      const { container } = await renderLoaded({
        ...profile,
        photo: "https://img.test/rouli.png",
      });

      expect(screen.getByAltText("Foto profil")).toHaveAttribute(
        "src",
        "https://img.test/rouli.png"
      );
      expect(getFileInput(container)).toBeInTheDocument();
    });
  });

  describe("ubah foto", () => {
    const file = new File(["bytes"], "baru.png", { type: "image/png" });

    it("memilih file: menampilkan preview, mengunggah, lalu memuat ulang profil", async () => {
      api.changePhotoApi.mockResolvedValue(ok);
      const { container } = await renderLoaded();
      api.getProfileApi.mockClear();

      await userEvent.upload(getFileInput(container), file);

      await waitFor(() => expect(api.changePhotoApi).toHaveBeenCalledWith(file));
      await waitFor(() => expect(api.getProfileApi).toHaveBeenCalledTimes(1));
      expect(URL.createObjectURL).toHaveBeenCalledWith(file);
      expect(screen.getByAltText("Foto profil")).toHaveAttribute("src", "blob:preview");
      expect(showSuccessDialog).toHaveBeenCalledWith("Berhasil");
    });

    it("perubahan input tanpa file diabaikan", async () => {
      const { container } = await renderLoaded();

      fireEvent.change(getFileInput(container), { target: { files: [] } });

      expect(api.changePhotoApi).not.toHaveBeenCalled();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    it("unggah gagal: dialog error tampil dan profil tetap dimuat ulang", async () => {
      api.changePhotoApi.mockRejectedValue(new Error("File terlalu besar"));
      const { container } = await renderLoaded();
      api.getProfileApi.mockClear();

      await userEvent.upload(getFileInput(container), file);

      await waitFor(() =>
        expect(showErrorDialog).toHaveBeenCalledWith("File terlalu besar")
      );
      await waitFor(() => expect(api.getProfileApi).toHaveBeenCalledTimes(1));
    });

    it("saat mengunggah: label 'Mengunggah...' dan input dinonaktifkan", async () => {
      renderWithProviders(<ProfilePage />, {
        preloadedState: {
          users: { ...initialUsers, profile, isChangeProfilePhoto: true },
        },
      });

      expect(screen.getByText("Mengunggah...")).toBeInTheDocument();
      expect(screen.queryByText("Ganti Foto")).not.toBeInTheDocument();
      await waitFor(() => expect(api.getProfileApi).toHaveBeenCalled());
    });

    it("keadaan awal: label 'Ganti Foto'", async () => {
      await renderLoaded();

      expect(screen.getByText("Ganti Foto")).toBeInTheDocument();
    });
  });

  describe("ubah informasi profil", () => {
    it("mengirim nama & email terbaru, lalu memuat ulang profil", async () => {
      const updated = { ...profile, name: "Rouli Baru", email: "baru@del.ac.id" };
      api.updateProfileApi.mockResolvedValue({
        ...ok,
        data: { user: updated },
      });
      const { store } = await renderLoaded();
      api.getProfileApi.mockClear();
      respondProfile(updated);

      await userEvent.clear(labelledInput("Nama"));
      await userEvent.type(labelledInput("Nama"), "Rouli Baru");
      await userEvent.clear(labelledInput("Email"));
      await userEvent.type(labelledInput("Email"), "baru@del.ac.id");
      await userEvent.click(screen.getByRole("button", { name: "Simpan Perubahan" }));

      await waitFor(() =>
        expect(api.updateProfileApi).toHaveBeenCalledWith(
          "Rouli Baru",
          "baru@del.ac.id"
        )
      );
      await waitFor(() => expect(api.getProfileApi).toHaveBeenCalledTimes(1));
      expect(showSuccessDialog).toHaveBeenCalledWith("Berhasil");
      await waitFor(() =>
        expect(store.getState().users.profile).toEqual(updated)
      );
    });

    it("gagal: dialog error tampil dan profil tetap dimuat ulang", async () => {
      api.updateProfileApi.mockRejectedValue(new Error("Email sudah dipakai"));
      await renderLoaded();
      api.getProfileApi.mockClear();

      await userEvent.click(screen.getByRole("button", { name: "Simpan Perubahan" }));

      await waitFor(() =>
        expect(showErrorDialog).toHaveBeenCalledWith("Email sudah dipakai")
      );
      await waitFor(() => expect(api.getProfileApi).toHaveBeenCalledTimes(1));
    });

    it("isChangeProfile=true: tombol 'Menyimpan...' dan dinonaktifkan", async () => {
      renderWithProviders(<ProfilePage />, {
        preloadedState: {
          users: { ...initialUsers, profile, isChangeProfile: true },
        },
      });

      expect(screen.getByRole("button", { name: "Menyimpan..." })).toBeDisabled();
      await waitFor(() => expect(api.getProfileApi).toHaveBeenCalled());
    });
  });

  describe("ubah kata sandi", () => {
    async function fillPasswords(current: string, next: string, confirm: string) {
      await userEvent.type(labelledInput("Kata Sandi Saat Ini"), current);
      await userEvent.type(labelledInput("Kata Sandi Baru"), next);
      await userEvent.type(labelledInput("Konfirmasi Kata Sandi Baru"), confirm);
    }

    it("berhasil: mengirim tiga field lalu mengosongkan ketiganya", async () => {
      api.changePasswordApi.mockResolvedValue(ok);
      await renderLoaded();

      await fillPasswords("lama123", "baru1234", "baru1234");
      await userEvent.click(screen.getByRole("button", { name: "Ubah Kata Sandi" }));

      await waitFor(() =>
        expect(api.changePasswordApi).toHaveBeenCalledWith(
          "lama123",
          "baru1234",
          "baru1234"
        )
      );
      await waitFor(() =>
        expect(labelledInput("Kata Sandi Saat Ini")).toHaveValue("")
      );
      expect(labelledInput("Kata Sandi Baru")).toHaveValue("");
      expect(labelledInput("Konfirmasi Kata Sandi Baru")).toHaveValue("");
      expect(showSuccessDialog).toHaveBeenCalledWith("Berhasil");
    });

    it("gagal: dialog error tampil dan isi field dipertahankan", async () => {
      api.changePasswordApi.mockRejectedValue(new Error("Sandi lama salah"));
      await renderLoaded();

      await fillPasswords("salah", "baru1234", "baru1234");
      await userEvent.click(screen.getByRole("button", { name: "Ubah Kata Sandi" }));

      await waitFor(() =>
        expect(showErrorDialog).toHaveBeenCalledWith("Sandi lama salah")
      );
      expect(labelledInput("Kata Sandi Saat Ini")).toHaveValue("salah");
      expect(labelledInput("Kata Sandi Baru")).toHaveValue("baru1234");
      expect(labelledInput("Konfirmasi Kata Sandi Baru")).toHaveValue("baru1234");
    });

    it("kata sandi baru dan konfirmasi dibatasi minimal 6 karakter", async () => {
      await renderLoaded();

      expect(labelledInput("Kata Sandi Baru")).toHaveAttribute("minLength", "6");
      expect(labelledInput("Konfirmasi Kata Sandi Baru")).toHaveAttribute("minLength", "6");
    });

    it("isChangeProfilePassword=true: tombol 'Menyimpan...' dan dinonaktifkan", async () => {
      renderWithProviders(<ProfilePage />, {
        preloadedState: {
          users: { ...initialUsers, profile, isChangeProfilePassword: true },
        },
      });

      expect(screen.getByRole("button", { name: "Menyimpan..." })).toBeDisabled();
      await waitFor(() => expect(api.getProfileApi).toHaveBeenCalled());
    });
  });
});
