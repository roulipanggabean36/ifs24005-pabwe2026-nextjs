"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { asyncGetUsers } from "../states/action";
import { IconSearch, IconUsers } from "@tabler/icons-react";

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const { users } = useAppSelector((state) => state.users);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(asyncGetUsers());
  }, [dispatch]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <IconUsers size={24} className="text-teal-600" />
            Daftar Pengguna
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {users.length} pengguna terdaftar
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <IconSearch
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-teal-100 overflow-hidden flex-shrink-0">
              {user.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photo}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-teal-700 font-semibold">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-slate-800 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">
          Tidak ada pengguna ditemukan
        </div>
      )}
    </div>
  );
}
