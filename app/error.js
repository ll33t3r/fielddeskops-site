"use client";

import { useEffect } from "react";
import { logError } from "../utils/logger";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    logError("App crash", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-[#0B0E13] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-[var(--text-sub)]">
            The app hit an unexpected error. Please try again or return to the dashboard.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => reset()}
              className="px-4 py-2 rounded-lg bg-[#FF6700] text-black font-semibold"
            >
              Try Again
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-sm"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
