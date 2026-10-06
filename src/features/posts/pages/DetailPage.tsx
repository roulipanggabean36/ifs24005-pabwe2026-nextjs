"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  asyncGetDetailPost,
  asyncLikePost,
  asyncAddComment,
  asyncDeleteComment,
  asyncDeletePost,
} from "../states/action";
import { clearPost } from "../states/reducer";
import { formatDate } from "@/helpers/toolsHelper";
import useInput from "@/hooks/useInput";
import ChangeModal from "../modals/ChangeModal";
import ChangeCoverModal from "../modals/ChangeCoverModal";
import {
  IconHeart,
  IconHeartFilled,
  IconArrowLeft,
  IconEdit,
  IconPhoto,
  IconTrash,
  IconSend,
} from "@tabler/icons-react";
import type { PostComment } from "@/types";

export default function DetailPage() {
  const params = useParams();
  const postId = params?.postId as string;
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { post, isPost } = useAppSelector((state) => state.posts);
  const profile = useAppSelector((state) => state.users.profile);

  const [comment, onCommentChange, , resetComment] = useInput("");
  const [showEdit, setShowEdit] = useState(false);
  const [showCover, setShowCover] = useState(false);

  useEffect(() => {
    if (postId) dispatch(asyncGetDetailPost(postId));
    // Bersihkan data lama agar tidak tampil sesaat saat membuka postingan lain
    return () => {
      dispatch(clearPost());
    };
  }, [dispatch, postId]);

  function refresh() {
    dispatch(asyncGetDetailPost(postId));
  }

  const isOwner = post && profile && post.user_id === profile.id;
  const likes = Array.isArray(post?.likes) ? (post!.likes as number[]) : [];
  const myCommentId = post?.my_comment?.id;
  const comments: PostComment[] = Array.isArray(post?.comments)
    ? (post!.comments as PostComment[]).filter(
        (c) =>
          typeof c === "object" &&
          c !== null &&
          "comment" in c &&
          c.id !== myCommentId
      )
    : [];
  const totalComments = comments.length + (post?.my_comment ? 1 : 0);
  const liked = profile?.id != null && likes.includes(profile.id);

  async function handleLike() {
    await dispatch(
      asyncLikePost({ id: post!.id, like: liked ? 0 : 1 })
    );
    refresh();
  }

  async function handleComment(e: FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    const result = await dispatch(
      asyncAddComment({ id: post!.id, comment: comment.trim() })
    );
    if (asyncAddComment.fulfilled.match(result)) {
      resetComment();
      refresh();
    }
  }

  async function handleDeleteComment() {
    const result = await dispatch(asyncDeleteComment(post!.id));
    if (asyncDeleteComment.fulfilled.match(result)) refresh();
  }

  async function handleDeletePost() {
    const result = await dispatch(asyncDeletePost(post!.id));
    if (asyncDeletePost.fulfilled.match(result)) {
      router.replace("/");
    }
  }

  if (isPost && !post) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">
        Memuat detail...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">
        Postingan tidak ditemukan
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-teal-700"
      >
        <IconArrowLeft size={18} />
        Kembali
      </button>

      <article className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {post.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover}
            alt=""
            className="w-full max-h-80 object-cover"
          />
        )}

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 overflow-hidden">
              {post.author?.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.author.photo}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-teal-700 font-semibold">
                  {post.author?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-slate-800">
                {post.author?.name || "Pengguna"}
              </p>
              <p className="text-xs text-slate-500">
                {formatDate(post.created_at)}
              </p>
            </div>
          </div>

          <p className="text-slate-700 whitespace-pre-wrap">{post.description}</p>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleLike}
              className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                liked ? "text-red-500" : "text-slate-500 hover:text-red-500"
              }`}
            >
              {liked ? <IconHeartFilled size={20} /> : <IconHeart size={20} />}
              {likes.length} Suka
            </button>

            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => setShowEdit(true)}
                  className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-teal-700"
                >
                  <IconEdit size={18} />
                  Ubah
                </button>
                <button
                  type="button"
                  onClick={() => setShowCover(true)}
                  className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-teal-700"
                >
                  <IconPhoto size={18} />
                  Cover
                </button>
                <button
                  type="button"
                  onClick={handleDeletePost}
                  className="inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
                >
                  <IconTrash size={18} />
                  Hapus
                </button>
              </>
            )}
          </div>
        </div>
      </article>

      {/* Comments */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-slate-800">
          Komentar ({totalComments})
        </h3>

        <form onSubmit={handleComment} className="flex gap-2">
          <input
            type="text"
            value={comment}
            onChange={onCommentChange}
            placeholder="Tulis komentar..."
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-lg bg-teal-700 hover:bg-teal-700 text-white"
          >
            <IconSend size={18} />
          </button>
        </form>

        {post.my_comment && (
          <div className="flex items-start justify-between gap-2 p-3 rounded-lg bg-teal-50 border border-teal-100">
            <div>
              <p className="text-xs font-medium text-teal-700 mb-0.5">
                Komentar Anda
              </p>
              <p className="text-sm text-slate-700">{post.my_comment.comment}</p>
            </div>
            <button
              type="button"
              onClick={handleDeleteComment}
              className="text-red-500 hover:text-red-600 p-1"
              title="Hapus komentar"
            >
              <IconTrash size={16} />
            </button>
          </div>
        )}

        <div className="space-y-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className="p-3 rounded-lg bg-slate-50 border border-slate-100"
            >
              <p className="text-sm text-slate-700">{c.comment}</p>
              <p className="text-xs text-slate-500 mt-1">
                {formatDate(c.created_at)}
              </p>
            </div>
          ))}
        </div>

        {comments.length === 0 && !post.my_comment && (
          <p className="text-sm text-slate-500 text-center py-2">
            Belum ada komentar
          </p>
        )}
      </div>

      <ChangeModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        postId={post.id}
        initialDescription={post.description}
        onSuccess={refresh}
      />
      <ChangeCoverModal
        open={showCover}
        onClose={() => setShowCover(false)}
        postId={post.id}
        onSuccess={refresh}
      />
    </div>
  );
}
