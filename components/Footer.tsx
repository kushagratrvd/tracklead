import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-4 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} TrackLead. All rights reserved.</p>
        <p className="font-medium">
          Built for{" "}
          <Link
            href="https://digitalheroesco.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
          >
            Digital Heroes Training Task
          </Link>
        </p>
      </div>
    </footer>
  );
}
