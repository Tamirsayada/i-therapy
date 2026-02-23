"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { SupabaseDataProvider } from "@/components/providers/SupabaseDataProvider";

const noHeaderPaths = ["/login", "/signup"];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideHeader = noHeaderPaths.includes(pathname);
  const isAuthPage = noHeaderPaths.includes(pathname);

  // Don't load data on auth pages
  if (isAuthPage) {
    return <main>{children}</main>;
  }

  return (
    <SupabaseDataProvider>
      {!hideHeader && <Header />}
      <main>{children}</main>
    </SupabaseDataProvider>
  );
}
