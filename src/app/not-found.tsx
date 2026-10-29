import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-gradient-brand text-7xl font-semibold tracking-tight">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-500">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link href="/" className={buttonClasses("primary", "md", "mt-8")}>
        Back to home
      </Link>
    </main>
  );
}
