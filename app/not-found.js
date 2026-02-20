import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 text-center space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-sub)]">404</p>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-sm text-[var(--text-sub)]">
          The page you requested does not exist or is not available.
        </p>
        <div className="flex flex-col gap-2">
          <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-[#FF6700] text-black font-semibold">
            Go to Dashboard
          </Link>
          <Link
            href="/welcome"
            className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-sm"
          >
            Back to Welcome
          </Link>
        </div>
      </div>
    </div>
  );
}
