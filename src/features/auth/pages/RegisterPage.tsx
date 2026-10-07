"use client";

import { SyntheticEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useInput from "@/hooks/useInput";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { asyncRegister } from "../states/action";
import { IconUser, IconMail, IconLock } from "@tabler/icons-react";

export default function RegisterPage() {
  const [name, onNameChange] = useInput("");
  const [email, onEmailChange] = useInput("");
  const [password, onPasswordChange] = useInput("");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthRegister } = useAppSelector((state) => state.auth);

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name || !email || !password) return;
    const result = await dispatch(asyncRegister({ name, email, password }));
    if (asyncRegister.fulfilled.match(result)) {
      router.push("/auth/login");
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-1">Daftar</h2>
      <p className="text-sm text-slate-500 mb-6">
        Buat akun baru untuk mulai memposting
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
            Nama
          </label>
          <div className="relative">
            <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              id="name"
              type="text"
              value={name}
              onChange={onNameChange}
              placeholder="Nama lengkap"
              required
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <div className="relative">
            <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              id="email"
              type="email"
              value={email}
              onChange={onEmailChange}
              placeholder="nama@email.com"
              required
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
            Kata Sandi
          </label>
          <div className="relative">
            <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              id="password"
              type="password"
              value={password}
              onChange={onPasswordChange}
              placeholder="Minimal 6 karakter"
              required
              minLength={6}
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isAuthRegister}
          className="w-full py-2.5 rounded-lg bg-teal-700 hover:bg-teal-700 text-white font-medium text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isAuthRegister ? "Memproses..." : "Daftar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Sudah punya akun?{" "}
        <Link href="/auth/login" className="text-teal-700 font-medium hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
