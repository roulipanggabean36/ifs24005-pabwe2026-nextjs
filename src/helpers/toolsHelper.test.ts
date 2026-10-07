import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const fire = vi.hoisted(() => vi.fn());
vi.mock("sweetalert2", () => ({ default: { fire } }));

import {
  formatDate,
  showConfirmDialog,
  showErrorDialog,
  showSuccessDialog,
  showWarningDialog,
} from "./toolsHelper";

describe("toolsHelper dialog", () => {
  beforeEach(() => {
    fire.mockReset();
    fire.mockResolvedValue({ isConfirmed: true });
  });

  it("showSuccessDialog: ikon success dengan judul default dan kustom", async () => {
    await showSuccessDialog("Tersimpan");
    expect(fire).toHaveBeenLastCalledWith(
      expect.objectContaining({ icon: "success", title: "Berhasil", text: "Tersimpan" })
    );

    await showSuccessDialog("Tersimpan", "Sukses");
    expect(fire).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: "Sukses" })
    );
  });

  it("showErrorDialog: ikon error dengan judul default dan kustom", async () => {
    await showErrorDialog("Ups");
    expect(fire).toHaveBeenLastCalledWith(
      expect.objectContaining({ icon: "error", title: "Gagal", text: "Ups" })
    );

    await showErrorDialog("Ups", "Error");
    expect(fire).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: "Error" })
    );
  });

  it("showWarningDialog: ikon warning dengan judul default dan kustom", async () => {
    await showWarningDialog("Hati-hati");
    expect(fire).toHaveBeenLastCalledWith(
      expect.objectContaining({ icon: "warning", title: "Peringatan", text: "Hati-hati" })
    );

    await showWarningDialog("Hati-hati", "Awas");
    expect(fire).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: "Awas" })
    );
  });

  it("showConfirmDialog: true bila dikonfirmasi, false bila dibatalkan", async () => {
    await expect(showConfirmDialog("Hapus?")).resolves.toBe(true);
    expect(fire).toHaveBeenLastCalledWith(
      expect.objectContaining({
        icon: "question",
        title: "Konfirmasi",
        showCancelButton: true,
        confirmButtonText: "Ya",
        cancelButtonText: "Batal",
      })
    );

    fire.mockResolvedValue({ isConfirmed: false });
    await expect(showConfirmDialog("Hapus?", "Yakin?")).resolves.toBe(false);
    expect(fire).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: "Yakin?" })
    );
  });
});

describe("formatDate", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mengembalikan '-' untuk nilai kosong", () => {
    expect(formatDate()).toBe("-");
    expect(formatDate(null)).toBe("-");
    expect(formatDate("")).toBe("-");
  });

  it("memformat tanggal valid ke locale id-ID", () => {
    const result = formatDate("2024-10-05T03:07:11.000000Z");
    expect(result).toContain("2024");
    expect(result).toContain("Oktober");
  });

  it("mengembalikan string asli bila pemformatan melempar error", () => {
    vi.spyOn(Date.prototype, "toLocaleDateString").mockImplementation(() => {
      throw new Error("boom");
    });
    expect(formatDate("2024-10-05")).toBe("2024-10-05");
  });
});
