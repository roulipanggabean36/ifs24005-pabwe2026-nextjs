"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/helpers/apiHelper";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-slate-50 to-cyan-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-700 text-white text-2xl font-bold shadow-lg mb-4">
            P
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Delcom Posts</h1>
          <p className="text-slate-600 mt-1 text-sm">
            Bagikan cerita dan ide Anda
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}