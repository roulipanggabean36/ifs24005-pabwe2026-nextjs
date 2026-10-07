import PostLayout from "@/features/posts/layouts/PostLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PostLayout>{children}</PostLayout>;
}
