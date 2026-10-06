import Swal from "sweetalert2";

export function showSuccessDialog(message: string, title = "Berhasil") {
  return Swal.fire({
    icon: "success",
    title,
    text: message,
    confirmButtonColor: "#0f766e",
  });
}

export function showErrorDialog(message: string, title = "Gagal") {
  return Swal.fire({
    icon: "error",
    title,
    text: message,
    confirmButtonColor: "#dc2626",
  });
}

export function showWarningDialog(message: string, title = "Peringatan") {
  return Swal.fire({
    icon: "warning",
    title,
    text: message,
    confirmButtonColor: "#d97706",
  });
}

export async function showConfirmDialog(
  message: string,
  title = "Konfirmasi"
): Promise<boolean> {
  const result = await Swal.fire({
    icon: "question",
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: "Ya",
    cancelButtonText: "Batal",
    confirmButtonColor: "#0f766e",
    cancelButtonColor: "#6b7280",
  });
  return result.isConfirmed;
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}
