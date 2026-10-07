"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, putAccessToken } from "@/helpers/apiHelper";
import { useAppDispatch } from "@/hooks/redux";
import { asyncGetProfile } from "@/features/users/states/action";
import NavbarComponent from "../components/NavbarComponent";
import SidebarComponent from "../components/SidebarComponent";

export default function PostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }
    dispatch(asyncGetProfile()).then((result) => {
      if (asyncGetProfile.fulfilled.match(result) && result.payload) {
        setReady(true);
      } else {
        putAccessToken(null);
        router.replace("/auth/login");
      }
    });
  }, [dispatch, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-sm">Memuat sesi...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <h1 className="sr-only">Delcom Posts</h1>
      <NavbarComponent onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className="flex">
        <Suspense fallback={null}>
          <SidebarComponent
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </Suspense>
        <main className="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}