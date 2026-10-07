"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { asyncLogout } from "@/features/auth/states/action";
import {
  IconLogout,
  IconUser,
  IconUsers,
  IconArticle,
  IconMenu2,
  IconChevronDown,
} from "@tabler/icons-react";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

const dropdownLinks = [
  { href: "/profile", label: "Profil Saya", icon: IconUser },
  { href: "/?tab=me", label: "Postingan Saya", icon: IconArticle },
  { href: "/users", label: "Daftar Pengguna", icon: IconUsers },
];

export default function NavbarComponent({
  onToggleSidebar,
}: Readonly<NavbarProps>) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const profile = useAppSelector((state) => state.users.profile);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  async function handleLogout() {
    await dispatch(asyncLogout());
    router.replace("/auth/login");
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-14 flex items-center px-4 gap-3">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
        aria-label="Toggle menu"
      >
        <IconMenu2 size={22} aria-hidden="true" />
      </button>

      <Link href="/" className="flex items-center gap-2 font-bold text-teal-700">
        <span
          aria-hidden="true"
          className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center text-sm"
        >
          P
        </span>
        <span>Delcom Posts</span>
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition"
          >
            <div className="w-8 h-8 rounded-full bg-teal-100 overflow-hidden">
              {profile?.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photo}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-teal-700 text-sm font-semibold">
                  {profile?.name?.charAt(0)?.toUpperCase() || (
                    <IconUser size={16} aria-hidden="true" />
                  )}
                </div>
              )}
            </div>
            <span className="hidden md:inline text-sm font-medium text-slate-700 max-w-[120px] truncate">
              {profile?.name || "Pengguna"}
            </span>
            <IconChevronDown
              size={16}
              aria-hidden="true"
              className="text-slate-500"
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-40"
            >
              <div className="px-4 pb-2 mb-1 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {profile?.name || "Pengguna"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {profile?.email || "-"}
                </p>
              </div>
              {dropdownLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Keluar"
          title="Keluar"
          className="p-2 rounded-lg hover:bg-red-50 text-slate-600 hover:text-red-700 transition"
        >
          <IconLogout size={20} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}