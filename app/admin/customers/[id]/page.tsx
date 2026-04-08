"use client";

import { useRouter, useParams } from "next/navigation";
import { useState } from "react";

const backArrowIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 19l-7-7 7-7" />
  </svg>
);

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id;

  // Mock customer data - replace with API call
  const [customer] = useState({
    id: customerId,
    name: "Juan Dela Cruz",
    email: "juandelacruz@gmail.com",
    phone: "0912-345-6789",
    idType: "Driver's License",
    idNumber: "N5012345678",
    address: "123 Main St, Taguig City",
    registered: "February 14, 2022",
    loyaltyPoints: 90,
    transactions: [
      {
        date: "April 3",
        item: "iPhone 12",
        amount: "₱24,000",
        status: "Active",
        branch: "Taguig",
      },
      {
        date: "April 4",
        item: "MacBook Pro",
        amount: "₱45,000",
        status: "Redeemed",
        branch: "Makati",
      },
      {
        date: "Mar 30",
        item: "Gold ring (18k)",
        amount: "₱8,500",
        status: "Overdue",
        branch: "Taguig",
      },
      {
        date: "Feb 10",
        item: "PlayStation 5",
        amount: "₱25,000",
        status: "Forfeited",
        branch: "Quezon",
      },
    ],
    rewards: [
      { name: "₱300 Cashback", points: "300 pts" },
      { name: "10% Discount", points: "200 pts" },
    ],
    deadlines: [
      {
        date: "April 20 2026",
        label: "3 days remaining",
        color: "warning",
      },
      {
        date: "Wed, Mar 25, 2026",
        label: "Wom due",
        color: "danger",
      },
    ],
    activities: [
      {
        type: "Contract renewed",
        date: "Jun 1, 2026",
        description: "iPhone 12 was renewed for 30 days",
      },
      {
        type: "Payment reminder sent",
        date: "Jun 15, Estim",
        description: "Gold ring renewal notice via SMS",
      },
      {
        type: "Customer visited",
        date: "Jun 14, 2026",
        description: "Inquired about laptop appraisal",
      },
    ],
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-50 text-green-700 border border-green-200";
      case "redeemed":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "overdue":
        return "bg-red-50 text-red-700 border border-red-200";
      case "forfeited":
        return "bg-gray-50 text-gray-700 border border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1 hover:bg-surface-hover rounded transition-colors"
        >
          {backArrowIcon}
        </button>
        <h1 className="text-2xl font-bold text-emerald-text">
          Customers
        </h1>
        <span className="text-xs text-text-muted">
          {customer.name}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column - Customer Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic Info Card */}
          <div className="rounded-lg border border-blue-300 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-2xl text-gray-600">👤</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Basic Info</h3>
                <p className="text-xs text-text-muted mt-1">
                  Created on {customer.registered} at Taguig Branch
                </p>
                <div className="mt-3 space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Name:</span> {customer.name}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {customer.email}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span>{" "}
                    {customer.phone}
                  </p>
                  <p>
                    <span className="font-medium">ID:</span> {customer.idNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="rounded-lg border border-border-main bg-white p-5">
            <h3 className="font-semibold text-gray-800 mb-4">
              Transaction History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 text-text-muted">
                      DATE
                    </th>
                    <th className="text-left py-2 px-2 text-text-muted">
                      ITEM
                    </th>
                    <th className="text-left py-2 px-2 text-text-muted">
                      AMOUNT
                    </th>
                    <th className="text-left py-2 px-2 text-text-muted">
                      STATUS
                    </th>
                    <th className="text-left py-2 px-2 text-text-muted">
                      BRANCH
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customer.transactions.map((tx, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2 text-text-primary">{tx.date}</td>
                      <td className="py-3 px-2 text-text-primary">{tx.item}</td>
                      <td className="py-3 px-2 font-semibold">{tx.amount}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center rounded px-2 py-1 text-xs font-semibold ${getStatusColor(
                            tx.status
                          )}`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-text-secondary">
                        {tx.branch}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes & Activity Log */}
          <div className="rounded-lg border border-border-main bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">
                Notes & Activity Log
              </h3>
              <button className="bg-emerald-700 text-white text-xs px-3 py-1 rounded hover:opacity-90">
                + Add Note
              </button>
            </div>
            <div className="space-y-3">
              {customer.activities.map((activity, idx) => (
                <div key={idx} className="flex gap-3 pb-3 border-b last:border-0">
                  <div className="h-2 w-2 rounded-full bg-emerald-600 mt-2" />
                  <div>
                    <p className="font-semibold text-sm text-gray-800">
                      {activity.type}
                    </p>
                    <p className="text-xs text-text-muted">{activity.date}</p>
                    <p className="text-sm text-text-secondary">
                      {activity.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-5">
          {/* Loyalty System */}
          <div className="rounded-lg border border-border-main bg-white p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Loyalty System</h3>
            <p className="text-3xl font-bold text-emerald-700 mb-2">
              {customer.loyaltyPoints} <span className="text-sm">Points</span>
            </p>
            <div className="bg-yellow-300 h-2 rounded-full w-3/4 mb-2" />
            <p className="text-xs text-text-muted">
              Earn 15 more points for reward
            </p>
          </div>

          {/* Rewards */}
          <div className="rounded-lg border border-border-main bg-white p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Rewards</h3>
            <div className="space-y-2">
              {customer.rewards.map((reward, idx) => (
                <div key={idx} className="text-sm">
                  <p className="font-medium text-gray-700">{reward.name}</p>
                  <p className="text-xs text-text-muted">{reward.points}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="rounded-lg border border-border-main bg-white p-5">
            <h3 className="font-semibold text-gray-800 mb-3">
              Upcoming Deadlines
            </h3>
            <div className="space-y-2">
              {customer.deadlines.map((deadline, idx) => (
                <div key={idx} className="text-sm">
                  <p className="font-medium text-gray-700">{deadline.date}</p>
                  <p
                    className={`text-xs ${
                      deadline.color === "warning"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {deadline.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
