"use client";

import { SyntheticEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useInput from "@/hooks/useInput";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { asyncLogin } from "../states/action";
import { IconMail, IconLock } from "@tabler/icons-react";

export default function LoginPage() {
  const [email, onEmailChange] = useInput("");
  const [password, onPasswordChange] = useInput("");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthLogin, authUser } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (authUser) {
      router.replace("/");
    }
  }, [authUser, router]);

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !password) return;
    const result = await dispatch(asyncLogin({ email, password }));
    if (asyncLogin.fulfilled.match(result)) {
      router.replace("/");
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-1">Masuk</h2>
      <p className="text-sm text-slate-500 mb-6">
        Masuk ke akun Anda untuk melanjutkan
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email-input" className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <div className="relative">
            <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              id="login-email-input"
              name="email"
              type="email"
              value={email}
              onChange={onEmailChange}
              placeholder="nama@email.com"
              required
              autoComplete="email"
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password-input" className="block text-sm font-medium text-slate-700 mb-1">
            Kata Sandi
          </label>
          <div className="relative">
            <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              id="login-password-input"
              name="password"
              type="password"
              value={password}
              onChange={onPasswordChange}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <button
          id="login-submit-button"
          type="submit"
          disabled={isAuthLogin}
          className="w-full py-2.5 rounded-lg bg-teal-700 hover:bg-teal-700 text-white font-medium text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isAuthLogin ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Belum punya akun?{" "}
        <Link href="/auth/register" className="text-teal-700 font-medium hover:underline">
          Daftar
        </Link>
      </p>
    </div>
  );
}