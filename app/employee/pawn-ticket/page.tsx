"use client";

import { useState } from "react";
import { NewPawnTicketModal } from "./_components/new-pawn-ticket-modal";

export default function EmployeePawnTicketPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold text-emerald-900 leading-tight">Pawn Tickets</h1>
        <p className="text-sm font-medium text-zinc-500 mt-1">
          Search, view, and manage pawn tickets assigned to your branch.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-zinc-300 bg-white/50 p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M7 12h10M7 8h10M7 16h10" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-zinc-900">Pawn Ticket Management</h3>
        <p className="mt-2 text-sm text-zinc-500 max-w-sm mx-auto">
          This module is currently being optimized to ensure seamless ticket issuance and tracking for your branch operations.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Generate New Ticket
          </button>
        </div>
      </div>

      <NewPawnTicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}