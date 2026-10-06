"use client";

import { FormEvent, useEffect } from "react";
import useInput from "@/hooks/useInput";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { asyncChangePost } from "../states/action";
import { IconX } from "@tabler/icons-react";

interface ChangeModalProps {
  open: boolean;
  onClose: () => void;
  postId: number | string;
  initialDescription?: string;
  onSuccess?: () => void;
}

export default function ChangeModal({
  open,
  onClose,
  postId,
  initialDescription = "",
  onSuccess,
}: ChangeModalProps) {
  const [description, onDescriptionChange, setDescription] = useInput("");
  const dispatch = useAppDispatch();
  const { isPostChange } = useAppSelector((state) => state.posts);

  useEffect(() => {
    if (open) setDescription(initialDescription);
  }, [open, initialDescription, setDescription]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    const result = await dispatch(
      asyncChangePost({ id: postId, description: description.trim() })
    );
    if (asyncChangePost.fulfilled.match(result)) {
      onClose();
      onSuccess?.();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Ubah Postingan</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 text-slate-500"
          >
            <IconX size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Deskripsi
            </label>
            <textarea
              value={description}
              onChange={onDescriptionChange}
              rows={4}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPostChange}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium disabled:opacity-60"
            >
              {isPostChange ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
