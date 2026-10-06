import { Suspense } from "react";
import HomePage from "@/features/posts/pages/HomePage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12 text-slate-400 text-sm">
          Memuat...
        </div>
      }
    >
      <HomePage />
    </Suspense>
  );
}