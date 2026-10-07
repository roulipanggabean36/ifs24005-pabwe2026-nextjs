"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  IconHome,
  IconUser,
  IconUsers,
  IconArticle,
  IconX,
} from "@tabler/icons-react";

const menus = [
  { href: "/", label: "Semua Postingan", icon: IconHome },
  { href: "/?tab=me", label: "Postingan Saya", icon: IconArticle },
  { href: "/users", label: "Daftar Pengguna", icon: IconUsers },
  { href: "/profile", label: "Profil Saya", icon: IconUser },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

function isMenuActive(href: string, pathname: string, tabMe: boolean) {
  if (href === "/") return pathname === "/" && !tabMe;
  if (href === "/?tab=me") return pathname === "/" && tabMe;
  return pathname.startsWith(href);
}

export default function SidebarComponent({
  open,
  onClose,
}: Readonly<SidebarProps>) {
  const pathname = usePathname();
  const tabMe = useSearchParams().get("tab") === "me";

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          role="presentation"
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 lg:z-20
          h-full lg:h-[calc(100vh-3.5rem)] w-64
          bg-white border-r border-slate-200
          transform transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          pt-14 lg:pt-0
        `}
      >
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-slate-100">
          <span className="font-semibold text-slate-800">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100"
          >
            <IconX size={20} />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {menus.map((menu) => {
            const isActive = isMenuActive(menu.href, pathname, tabMe);
            const Icon = menu.icon;
            return (
              <Link
                key={menu.href + menu.label}
                href={menu.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                  ${
                    isActive
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }
                `}
              >
                <Icon size={20} />
                {menu.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}