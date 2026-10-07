import AuthLayout from "@/features/auth/layouts/AuthLayout";

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AuthLayout>{children}</AuthLayout>;
}