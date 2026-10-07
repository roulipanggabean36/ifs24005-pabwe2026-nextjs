import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor, fireEvent } from "@/test-utils";
import AddModal from "./AddModal";
import postsReducer from "../states/reducer";
import { addPostApi } from "../api/postApi";
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

function getForm() {
  return screen.getByRole("button", { name: "Publikasikan" }).closest("form") as HTMLFormElement;
}

describe("AddModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(showSuccessDialog).mockResolvedValue(undefined as never);
    vi.mocked(showErrorDialog).mockResolvedValue(undefined as never);
  });

  it("open=false: tidak merender apa pun", () => {
    const { container } = renderWithProviders(
      <AddModal open={false} onClose={vi.fn()} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("open=true: merender judul, textarea, dan tombol aksi", () => {
    renderWithProviders(<AddModal open onClose={vi.fn()} />);

    expect(screen.getByText("Postingan Baru")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Apa yang ingin Anda bagikan?")
    ).toHaveValue("");
    expect(screen.getByRole("button", { name: "Batal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publikasikan" })).toBeEnabled();
  });

  it("textarea memperbarui nilainya saat diketik", async () => {
    renderWithProviders(<AddModal open onClose={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("Apa yang ingin Anda bagikan?");

    await userEvent.type(textarea, "Halo dunia");

    expect(textarea).toHaveValue("Halo dunia");
  });

  it("tombol 'Batal' dan ikon X sama-sama memanggil onClose", async () => {
    const onClose = vi.fn();
    renderWithProviders(<AddModal open onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "Batal" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    // tombol pertama pada DOM adalah ikon X di header modal
    await userEvent.click(screen.getAllByRole("button")[0]);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("deskripsi kosong atau hanya spasi: API tidak dipanggil", async () => {
    renderWithProviders(<AddModal open onClose={vi.fn()} />);

    fireEvent.submit(getForm());
    expect(addPostApi).not.toHaveBeenCalled();

    await userEvent.type(
      screen.getByPlaceholderText("Apa yang ingin Anda bagikan?"),
      "    "
    );
    fireEvent.submit(getForm());
    expect(addPostApi).not.toHaveBeenCalled();
  });

  it("berhasil: mengirim deskripsi yang di-trim, mereset input, menutup modal, dan memanggil onSuccess", async () => {
    vi.mocked(addPostApi).mockResolvedValue({
      status: "success",
      message: "Posting ditambah",
      data: { post_id: 10 },
    });
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const { store } = renderWithProviders(
      <AddModal open onClose={onClose} onSuccess={onSuccess} />
    );
    const textarea = screen.getByPlaceholderText("Apa yang ingin Anda bagikan?");

    await userEvent.type(textarea, "  Isi postingan  ");
    await userEvent.click(screen.getByRole("button", { name: "Publikasikan" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(addPostApi).toHaveBeenCalledWith("Isi postingan");
    expect(showSuccessDialog).toHaveBeenCalledWith("Posting ditambah");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(textarea).toHaveValue("");
    expect(store.getState().posts.isPostAdded).toBe(true);
  });

  it("berhasil tanpa prop onSuccess: tidak error dan modal tetap ditutup", async () => {
    vi.mocked(addPostApi).mockResolvedValue({
      status: "success",
      message: "ok",
      data: { post_id: 11 },
    });
    const onClose = vi.fn();
    renderWithProviders(<AddModal open onClose={onClose} />);

    await userEvent.type(
      screen.getByPlaceholderText("Apa yang ingin Anda bagikan?"),
      "Isi"
    );
    await userEvent.click(screen.getByRole("button", { name: "Publikasikan" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("gagal: dialog error tampil, modal tidak ditutup, dan input dipertahankan", async () => {
    vi.mocked(addPostApi).mockRejectedValue(new Error("Gagal menyimpan"));
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const { store } = renderWithProviders(
      <AddModal open onClose={onClose} onSuccess={onSuccess} />
    );
    const textarea = screen.getByPlaceholderText("Apa yang ingin Anda bagikan?");

    await userEvent.type(textarea, "Isi");
    await userEvent.click(screen.getByRole("button", { name: "Publikasikan" }));

    await waitFor(() =>
      expect(showErrorDialog).toHaveBeenCalledWith("Gagal menyimpan")
    );
    await waitFor(() => expect(store.getState().posts.isPostAdd).toBe(false));
    expect(onClose).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(textarea).toHaveValue("Isi");
  });

  it("isPostAdd=true: tombol menampilkan 'Mengirim...' dan dinonaktifkan", () => {
    renderWithProviders(<AddModal open onClose={vi.fn()} />, {
      preloadedState: { posts: { ...initialPosts, isPostAdd: true } },
    });

    expect(screen.getByRole("button", { name: "Mengirim..." })).toBeDisabled();
  });
});
