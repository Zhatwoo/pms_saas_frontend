"use client";

import { useState } from "react";

export default function EmployeeSettingsPage() {
  const [activeTab, setActiveTab] = useState("Profile");
  const branchName = "Taguig Branch";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-emerald-900 leading-tight">Settings</h1>
      </div>

      <div className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-1 max-w-fit overflow-hidden">
        {["Profile", "Branch Config"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 text-xs font-bold transition-all rounded-md ${
              activeTab === tab
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {activeTab === "Profile" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-zinc-800 mb-4 pb-2 border-b">My Account Profile</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wide">Full Name</label>
                    <input className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 focus:border-emerald-500 outline-none" defaultValue="Employee Name" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wide">Job Title</label>
                     <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm text-zinc-500">Branch Associate / Auditor</div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wide">Email Address</label>
                  <input className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 focus:border-emerald-500 outline-none" defaultValue="employee@gmail.com" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "Branch Config" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-emerald-800 mb-4 pb-2 border-b">Current Location: {branchName}</h3>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wide">Opening Time</label>
                    <p className="text-sm text-zinc-800 pt-1">08:00 AM</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wide">Closing Time</label>
                    <p className="text-sm text-zinc-800 pt-1">06:00 PM</p>
                  </div>
                  <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 col-span-2">
                    <p className="text-[10px] font-bold uppercase text-emerald-700 tracking-wide mb-1 flex items-center gap-1.5">
                       <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                       Security Restriction
                    </p>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      Branch associates are restricted to accessing data for their assigned terminal only. 
                      Changes to operation hours must be approved by the Super Admin.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
             <button className="rounded-lg bg-emerald-700 px-6 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition-colors">
               Save Changes
             </button>
             <button className="rounded-lg border border-zinc-300 px-6 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50">
               Discard
             </button>
          </div>
        </div>

        <div className="space-y-6">
           <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-800 flex items-center justify-center text-white text-3xl font-bold mb-4 border-4 border-emerald-50">
                 E
              </div>
              <h4 className="text-lg font-bold text-zinc-900">Branch Analyst</h4>
              <p className="text-xs text-zinc-500 mb-4">{branchName}</p>
              <button className="w-full py-2 rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-100">
                Change Avatar
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
