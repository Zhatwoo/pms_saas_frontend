"use client";

import { useState } from "react";
import type { NavGroup } from "@/types";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";

interface AppLayoutProps {
  navGroups: NavGroup[];
  userInitials?: string;
  notificationCount?: number;
  onLogout?: () => void;
  children: React.ReactNode;
}

export function AppLayout({
  navGroups,
  userInitials,
  notificationCount,
  onLogout,
  children,
}: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        navGroups={navGroups}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        onLogout={onLogout}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          userInitials={userInitials}
          notificationCount={notificationCount}
        />
        <main className="flex-1 overflow-y-auto bg-pawn-content p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
