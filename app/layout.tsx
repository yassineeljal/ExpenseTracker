import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Expense Tracker" };

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-xl px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10">
      {children}
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <header className="sticky top-0 z-10 border-b bg-[rgb(var(--card))]/80 backdrop-blur">
            <div className="container-app py-3 flex items-center justify-between">
              <Link href="/" className="text-lg font-semibold">💰 Expense Tracker</Link>
              <nav className="flex items-center gap-1">
                <NavLink href="/">Dashboard</NavLink>
                <NavLink href="/transactions">Transactions</NavLink>
                <NavLink href="/budgets">Budgets</NavLink>
                <NavLink href="/categories">Catégories</NavLink>
                <div className="ml-2"><ThemeToggle /></div>
              </nav>
            </div>
          </header>
          <main className="container-app space-y-6">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
