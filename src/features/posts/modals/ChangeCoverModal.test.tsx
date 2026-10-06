import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor, fireEvent } from "@/test-utils";
import ChangeCoverModal from "./ChangeCoverModal";
import postsReducer from "../states/reducer";
import { changeCoverPostApi } from "../api/postApi";
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
const imageFile = new File(["(isi gambar)"], "cover.png", { type: "image/png" });

function getFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

function getForm() {
  return screen.getByRole("button", { name: /Unggah|Mengunggah/ }).closest("form") as HTMLFormElement;
}

describe("ChangeCoverModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(showSuccessDialog).mockResolvedValue(undefined as never);
    vi.mocked(showErrorDialog).mockResolvedValue(undefined as never);
    // jsdom tidak menyediakan URL.createObjectURL
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(() => "blob:preview-url"),
    });
  });

  afterEach(() => {
    // @ts-expect-error - membersihkan stub
    delete URL.createObjectURL;
  });

  it("open=false: tidak merender apa pun", () => {
    const { container } = renderWithProviders(
      <ChangeCoverModal open={false} onClose={vi.fn()} postId={1} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("open=true tanpa file: menampilkan placeholder dan tombol 'Unggah' nonaktif", () => {
    renderWithProviders(<ChangeCoverModal open onClose={vi.fn()} postId={1} />);

    expect(screen.getByText("Ubah Cover")).toBeInTheDocument();
    expect(screen.getByText("Pilih gambar cover")).toBeInTheDocument();
    expect(screen.queryByAltText("Preview")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unggah" })).toBeDisabled();
  });

  it("memilih file: menampilkan preview dan mengaktifkan tombol 'Unggah'", async () => {
    const { container } = renderWithProviders(
      <ChangeCoverModal open onClose={vi.fn()} postId={1} />
    );

    await userEvent.upload(getFileInput(container), imageFile);

    expect(URL.createObjectURL).toHaveBeenCalledWith(imageFile);
    expect(screen.getByAltText("Preview")).toHaveAttribute("src", "blob:preview-url");
    expect(screen.queryByText("Pilih gambar cover")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unggah" })).toBeEnabled();
  });

  it("perubahan input tanpa file (dibatalkan) diabaikan", () => {
    const { container } = renderWithProviders(
      <ChangeCoverModal open onClose={vi.fn()} postId={1} />
    );

    fireEvent.change(getFileInput(container), { target: { files: [] } });

    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(screen.getByText("Pilih gambar cover")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unggah" })).toBeDisabled();
  });

  it("submit tanpa file: API tidak dipanggil", () => {
    renderWithProviders(<ChangeCoverModal open onClose={vi.fn()} postId={1} />);

    fireEvent.submit(getForm());

    expect(changeCoverPostApi).not.toHaveBeenCalled();
  });

  it("berhasil: mengunggah file, mereset preview, menutup modal, memanggil onSuccess", async () => {
    vi.mocked(changeCoverPostApi).mockResolvedValue({
      status: "success",
      message: "Cover diubah",
    });
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const { container, store } = renderWithProviders(
      <ChangeCoverModal open onClose={onClose} postId={5} onSuccess={onSuccess} />
    );

    await userEvent.upload(getFileInput(container), imageFile);
    await userEvent.click(screen.getByRole("button", { name: "Unggah" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(changeCoverPostApi).toHaveBeenCalledWith(5, imageFile);
    expect(showSuccessDialog).toHaveBeenCalledWith("Cover diubah");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByAltText("Preview")).not.toBeInTheDocument();
    expect(screen.getByText("Pilih gambar cover")).toBeInTheDocument();
    expect(store.getState().posts.isPostChangedCover).toBe(true);
  });

  it("berhasil tanpa prop onSuccess: tidak error dan modal ditutup", async () => {
    vi.mocked(changeCoverPostApi).mockResolvedValue({ status: "success", message: "ok" });
    const onClose = vi.fn();
    const { container } = renderWithProviders(
      <ChangeCoverModal open onClose={onClose} postId="p-1" />
    );

    await userEvent.upload(getFileInput(container), imageFile);
    await userEvent.click(screen.getByRole("button", { name: "Unggah" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(changeCoverPostApi).toHaveBeenCalledWith("p-1", imageFile);
  });

  it("gagal: dialog error tampil; modal tetap terbuka dan preview dipertahankan", async () => {
    vi.mocked(changeCoverPostApi).mockRejectedValue(new Error("Format tidak didukung"));
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const { container, store } = renderWithProviders(
      <ChangeCoverModal open onClose={onClose} postId={5} onSuccess={onSuccess} />
    );

    await userEvent.upload(getFileInput(container), imageFile);
    await userEvent.click(screen.getByRole("button", { name: "Unggah" }));

    await waitFor(() =>
      expect(showErrorDialog).toHaveBeenCalledWith("Format tidak didukung")
    );
    await waitFor(() =>
      expect(store.getState().posts.isPostChangeCover).toBe(false)
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByAltText("Preview")).toBeInTheDocument();
  });

  it("tombol 'Batal' mereset file/preview lalu memanggil onClose", async () => {
    const onClose = vi.fn();
    const { container } = renderWithProviders(
      <ChangeCoverModal open onClose={onClose} postId={1} />
    );
    await userEvent.upload(getFileInput(container), imageFile);
    expect(screen.getByAltText("Preview")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Batal" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByAltText("Preview")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unggah" })).toBeDisabled();
  });

  it("ikon X (header) juga mereset dan memanggil onClose", async () => {
    const onClose = vi.fn();
    const { container } = renderWithProviders(
      <ChangeCoverModal open onClose={onClose} postId={1} />
    );
    await userEvent.upload(getFileInput(container), imageFile);

    await userEvent.click(screen.getAllByRole("button")[0]);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByAltText("Preview")).not.toBeInTheDocument();
  });

  it("isPostChangeCover=true: tombol 'Mengunggah...' dan dinonaktifkan meski file dipilih", async () => {
    const { container } = renderWithProviders(
      <ChangeCoverModal open onClose={vi.fn()} postId={1} />,
      { preloadedState: { posts: { ...initialPosts, isPostChangeCover: true } } }
    );
    await userEvent.upload(getFileInput(container), imageFile);

    expect(screen.getByRole("button", { name: "Mengunggah..." })).toBeDisabled();
  });
});
