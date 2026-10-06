"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  asyncGetPosts,
  asyncLikePost,
  asyncDeleteAllPosts,
} from "../states/action";
import { formatDate } from "@/helpers/toolsHelper";
import AddModal from "../modals/AddModal";
import {
  IconPlus,
  IconSearch,
  IconHeart,
  IconHeartFilled,
  IconMessageCircle,
  IconTrash,
} from "@tabler/icons-react";

export default function HomePage() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const tabMe = searchParams.get("tab") === "me";

  const { posts, isPost } = useAppSelector((state) => state.posts);
  const profile = useAppSelector((state) => state.users.profile);

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    dispatch(asyncGetPosts(tabMe ? true : undefined));
  }, [dispatch, tabMe]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.description?.toLowerCase().includes(q) ||
        p.author?.name?.toLowerCase().includes(q)
    );
  }, [posts, search]);

  function refresh() {
    dispatch(asyncGetPosts(tabMe ? true : undefined));
  }

  async function handleLike(postId: number, likes: number[] = []) {
    const myId = profile?.id;
    const liked = myId != null && likes.includes(myId);
    await dispatch(asyncLikePost({ id: postId, like: liked ? 0 : 1 }));
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {tabMe ? "Postingan Saya" : "Semua Postingan"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {posts.length} postingan
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 sm:w-64">
            <IconSearch
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari postingan..."
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-700 text-white text-sm font-medium"
          >
            <IconPlus size={18} />
            Posting
          </button>
          {tabMe && posts.length > 0 && (
            <button
              type="button"
              onClick={() => dispatch(asyncDeleteAllPosts()).then(refresh)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50"
            >
              <IconTrash size={16} />
              Hapus Semua
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        <Link
          href="/"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            !tabMe
              ? "border-teal-700 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Semua
        </Link>
        <Link
          href="/?tab=me"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            tabMe
              ? "border-teal-700 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Milik Saya
        </Link>
      </div>

      {isPost && (
        <div className="text-center py-8 text-slate-500 text-sm">
          Memuat postingan...
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((post) => {
          const likes = Array.isArray(post.likes) ? post.likes : [];
          const commentsCount = Array.isArray(post.comments)
            ? post.comments.length
            : 0;
          const myId = profile?.id;
          const liked = myId != null && likes.includes(myId);

          return (
            <article
              key={post.id}
              className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col"
            >
              {post.cover && (
                <Link href={`/posts/${post.id}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.cover}
                    alt=""
                    className="w-full h-40 object-cover"
                  />
                </Link>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-teal-100 overflow-hidden flex-shrink-0">
                    {post.author?.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.author.photo}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-teal-700 text-xs font-semibold">
                        {post.author?.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {post.author?.name || "Pengguna"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(post.created_at)}
                    </p>
                  </div>
                </div>

                <Link href={`/posts/${post.id}`} className="flex-1">
                  <p className="text-sm text-slate-700 line-clamp-3">
                    {post.description}
                  </p>
                </Link>

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleLike(post.id, likes as number[])}
                    className={`inline-flex items-center gap-1 text-sm ${
                      liked ? "text-red-500" : "text-slate-500 hover:text-red-500"
                    }`}
                  >
                    {liked ? (
                      <IconHeartFilled size={18} />
                    ) : (
                      <IconHeart size={18} />
                    )}
                    {likes.length}
                  </button>
                  <Link
                    href={`/posts/${post.id}`}
                    className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-teal-700"
                  >
                    <IconMessageCircle size={18} />
                    {commentsCount}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!isPost && filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">
          Belum ada postingan
        </div>
      )}

      <AddModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={refresh}
      />
    </div>
  );
}
