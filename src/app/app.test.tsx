import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/font/google", () => ({
  Plus_Jakarta_Sans: () => ({ variable: "font-test" }),
}));

vi.mock("@/features/auth/layouts/AuthLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-layout">{children}</div>
  ),
}));
vi.mock("@/features/auth/pages/LoginPage", () => ({
  default: () => <p>LoginPage</p>,
}));
vi.mock("@/features/auth/pages/RegisterPage", () => ({
  default: () => <p>RegisterPage</p>,
}));
vi.mock("@/features/posts/layouts/PostLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="post-layout">{children}</div>
  ),
}));
vi.mock("@/features/posts/pages/HomePage", () => ({
  default: () => <p>HomePage</p>,
}));
vi.mock("@/features/posts/pages/DetailPage", () => ({
  default: () => <p>DetailPage</p>,
}));
vi.mock("@/features/users/pages/UsersPage", () => ({
  default: () => <p>UsersPage</p>,
}));
vi.mock("@/features/users/pages/ProfilePage", () => ({
  default: () => <p>ProfilePage</p>,
}));

import RootLayout, { metadata } from "./layout";
import AuthRouteLayout from "./auth/layout";
import LoginRoute from "./auth/login/page";
import RegisterRoute from "./auth/register/page";
import DashboardLayout from "./(dashboard)/layout";
import HomeRoute from "./(dashboard)/page";
import DetailRoute from "./(dashboard)/posts/[postId]/page";
import UsersRoute from "./(dashboard)/users/page";
import ProfileRoute from "./(dashboard)/profile/page";

describe("rute App Router", () => {
  it("root layout: metadata, font, dan Providers membungkus children", () => {
    expect(metadata.title).toBe("Delcom Posts");

    const html = renderToStaticMarkup(
      <RootLayout>
        <p>konten</p>
      </RootLayout>
    );
    expect(html).toContain('lang="id"');
    expect(html).toContain("font-test");
    expect(html).toContain("konten");
  });

  it("auth layout membungkus AuthLayout", () => {
    render(
      <AuthRouteLayout>
        <p>anak</p>
      </AuthRouteLayout>
    );
    expect(screen.getByTestId("auth-layout")).toContainElement(
      screen.getByText("anak")
    );
  });

  it("halaman login dan register merender komponen halamannya", () => {
    render(<LoginRoute />);
    expect(screen.getByText("LoginPage")).toBeInTheDocument();
    render(<RegisterRoute />);
    expect(screen.getByText("RegisterPage")).toBeInTheDocument();
  });

  it("dashboard layout membungkus PostLayout", () => {
    render(
      <DashboardLayout>
        <p>anak</p>
      </DashboardLayout>
    );
    expect(screen.getByTestId("post-layout")).toContainElement(
      screen.getByText("anak")
    );
  });

  it("halaman beranda, detail, pengguna, dan profil merender komponen halamannya", () => {
    render(<HomeRoute />);
    expect(screen.getByText("HomePage")).toBeInTheDocument();
    render(<DetailRoute />);
    expect(screen.getByText("DetailPage")).toBeInTheDocument();
    render(<UsersRoute />);
    expect(screen.getByText("UsersPage")).toBeInTheDocument();
    render(<ProfileRoute />);
    expect(screen.getByText("ProfilePage")).toBeInTheDocument();
  });
});
