"use client";

import { SyntheticEvent, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { asyncChangeCoverPost } from "../states/action";
import { IconX, IconPhoto } from "@tabler/icons-react";

interface ChangeCoverModalProps {
  open: boolean;
  onClose: () => void;
  postId: number | string;
  onSuccess?: () => void;
}

export default function ChangeCoverModal({
  open,
  onClose,
  postId,
  onSuccess,
}: Readonly<ChangeCoverModalProps>) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const { isPostChangeCover } = useAppSelector((state) => state.posts);

  if (!open) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;
    const result = await dispatch(
      asyncChangeCoverPost({ id: postId, file })
    );
    if (asyncChangeCoverPost.fulfilled.match(result)) {
      setFile(null);
      setPreview(null);
      onClose();
      onSuccess?.();
    }
  }

  function handleClose() {
    setFile(null);
    setPreview(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Ubah Cover</h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded hover:bg-slate-100 text-slate-500"
          >
            <IconX size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Preview"
                className="max-h-48 mx-auto rounded-lg object-contain"
              />
            ) : (
              <div className="text-slate-500">
                <IconPhoto size={40} className="mx-auto mb-2" />
                <p className="text-sm">Pilih gambar cover</p>
              </div>
            )}
            <label className="inline-block mt-3 px-4 py-2 rounded-lg border border-slate-200 text-sm cursor-pointer hover:bg-slate-50">
              <span>Pilih File</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!file || isPostChangeCover}
              className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-700 text-white text-sm font-medium disabled:opacity-60"
            >
              {isPostChangeCover ? "Mengunggah..." : "Unggah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}