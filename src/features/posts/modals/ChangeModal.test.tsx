import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor, fireEvent } from "@/test-utils";
import ChangeModal from "./ChangeModal";
import postsReducer from "../states/reducer";
import { updatePostApi } from "../api/postApi";
import { showErrorDialog, showSuccessDialog } from "@/helpers/toolsHelper";

vi.mock("../api/postApi", () => ({
  getAllPostsApi: vi.fn(),
  getDetailPostApi: vi.fn(),
  addPostApi: vi.fn(),
  updatePostApi: vi.fn(),
  changeCoverPostApi: vi.fn(),
  deletePostApi: vi.fn(),
  likePostApi: vi.fn(),
  addCommentApi: vi.fn(),
  deleteCommentApi: vi.fn(),
  deleteAllPostsApi: vi.fn(),
}));

vi.mock("@/helpers/toolsHelper", () => ({
  showSuccessDialog: vi.fn(),
  showErrorDialog: vi.fn(),
  showConfirmDialog: vi.fn(),
}));

const initialPosts = postsReducer(undefined, { type: "@@INIT" });

function getTextarea() {
  return screen.getByRole("textbox") as HTMLTextAreaElement;
}

function getForm() {
  return screen.getByRole("button", { name: "Simpan" }).closest("form") as HTMLFormElement;
}

describe("ChangeModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(showSuccessDialog).mockResolvedValue(undefined as never);
    vi.mocked(showErrorDialog).mockResolvedValue(undefined as never);
  });

  it("open=false: tidak merender apa pun", () => {
    const { container } = renderWithProviders(
      <ChangeModal open={false} onClose={vi.fn()} postId={1} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("open=true: terisi dengan initialDescription", () => {
    renderWithProviders(
      <ChangeModal
        open
        onClose={vi.fn()}
        postId={1}
        initialDescription="Deskripsi lama"
      />
    );

    expect(screen.getByText("Ubah Postingan")).toBeInTheDocument();
    expect(getTextarea()).toHaveValue("Deskripsi lama");
  });

  it("tanpa initialDescription: textarea kosong (nilai default)", () => {
    renderWithProviders(<ChangeModal open onClose={vi.fn()} postId={1} />);

    expect(getTextarea()).toHaveValue("");
  });

  it("saat open berubah false -> true: deskripsi diisi ulang dari initialDescription", () => {
    const { rerender } = renderWithProviders(
      <ChangeModal
        open={false}
        onClose={vi.fn()}
        postId={1}
        initialDescription="Awal"
      />
    );

    rerender(
      <ChangeModal
        open
        onClose={vi.fn()}
        postId={1}
        initialDescription="Awal"
      />
    );

    expect(getTextarea()).toHaveValue("Awal");
  });

  it("textarea dapat diedit", async () => {
    renderWithProviders(
      <ChangeModal open onClose={vi.fn()} postId={1} initialDescription="A" />
    );

    await userEvent.type(getTextarea(), "BC");

    expect(getTextarea()).toHaveValue("ABC");
  });

  it("tombol 'Batal' dan ikon X memanggil onClose", async () => {
    const onClose = vi.fn();
    renderWithProviders(<ChangeModal open onClose={onClose} postId={1} />);

    await userEvent.click(screen.getByRole("button", { name: "Batal" }));
    await userEvent.click(screen.getAllByRole("button")[0]);

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("deskripsi kosong/spasi saja: API tidak dipanggil", async () => {
    renderWithProviders(<ChangeModal open onClose={vi.fn()} postId={1} />);

    fireEvent.submit(getForm());
    expect(updatePostApi).not.toHaveBeenCalled();

    await userEvent.type(getTextarea(), "   ");
    fireEvent.submit(getForm());
    expect(updatePostApi).not.toHaveBeenCalled();
  });

  it("berhasil: memanggil updatePostApi dengan deskripsi ter-trim, menutup modal, memanggil onSuccess", async () => {
    vi.mocked(updatePostApi).mockResolvedValue({
      status: "success",
      message: "Diubah",
    });
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const { store } = renderWithProviders(
      <ChangeModal
        open
        onClose={onClose}
        postId={42}
        initialDescription="Lama"
        onSuccess={onSuccess}
      />
    );

    await userEvent.clear(getTextarea());
    await userEvent.type(getTextarea(), "  Baru  ");
    await userEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(updatePostApi).toHaveBeenCalledWith(42, "Baru");
    expect(showSuccessDialog).toHaveBeenCalledWith("Diubah");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(store.getState().posts.isPostChanged).toBe(true);
  });

  it("berhasil tanpa prop onSuccess: tidak error dan modal ditutup", async () => {
    vi.mocked(updatePostApi).mockResolvedValue({ status: "success", message: "ok" });
    const onClose = vi.fn();
    renderWithProviders(
      <ChangeModal open onClose={onClose} postId="abc" initialDescription="Isi" />
    );

    await userEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(updatePostApi).toHaveBeenCalledWith("abc", "Isi");
  });

  it("gagal: dialog error tampil, modal tidak ditutup, onSuccess tidak dipanggil", async () => {
    vi.mocked(updatePostApi).mockRejectedValue(new Error("Tidak diizinkan"));
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const { store } = renderWithProviders(
      <ChangeModal
        open
        onClose={onClose}
        postId={1}
        initialDescription="Isi"
        onSuccess={onSuccess}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() =>
      expect(showErrorDialog).toHaveBeenCalledWith("Tidak diizinkan")
    );
    await waitFor(() => expect(store.getState().posts.isPostChange).toBe(false));
    expect(onClose).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("isPostChange=true: tombol 'Menyimpan...' dan dinonaktifkan", () => {
    renderWithProviders(<ChangeModal open onClose={vi.fn()} postId={1} />, {
      preloadedState: { posts: { ...initialPosts, isPostChange: true } },
    });

    expect(screen.getByRole("button", { name: "Menyimpan..." })).toBeDisabled();
  });
});
