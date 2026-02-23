"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/", label: "בית", icon: "🏠" },
  { href: "/journal", label: "יומן", icon: "📓" },
  { href: "/dashboard", label: "דשבורד", icon: "📊" },
  { href: "/history", label: "היסטוריה", icon: "📜" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Desktop header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border-light">
        <div className="max-w-5xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
              <span className="text-white text-sm font-bold">i</span>
            </div>
            <span className="text-lg font-semibold text-text-primary tracking-tight">
              i-therapy
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary-lightest text-primary"
                    : "text-text-muted hover:text-text-secondary hover:bg-surface"
                )}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl text-sm font-medium text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors mr-2"
            >
              התנתק
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-border-light safe-area-bottom">
        <div className="flex items-center justify-around h-14 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors min-w-[56px]",
                pathname === item.href
                  ? "text-primary"
                  : "text-text-muted"
              )}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
