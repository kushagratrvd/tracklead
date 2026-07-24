import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-6 px-4 text-center text-sm text-zinc-600 dark:text-zinc-400 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          TrackLead Sales Platform
        </div>
        <p className="text-xs sm:text-sm">
          <a
            href="https://digitalheroesco.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 underline underline-offset-4 transition-colors"
          >
            Built for Digital Heroes Training Task
          </a>
        </p>
      </div>
    </footer>
  );
}
