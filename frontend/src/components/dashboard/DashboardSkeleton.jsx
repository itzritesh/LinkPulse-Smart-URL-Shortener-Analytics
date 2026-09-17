import React from "react";

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-slate-800 rounded"></div>
              <div className="w-7 h-7 bg-slate-800 rounded-lg"></div>
            </div>
            <div className="h-7 w-20 bg-slate-800 rounded"></div>
            <div className="h-3 w-28 bg-slate-800 rounded"></div>
          </div>
        ))}
      </div>

      {/* Main Clicks Chart Skeleton */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-1.5">
            <div className="h-4 w-36 bg-slate-800 rounded"></div>
            <div className="h-3 w-56 bg-slate-800/60 rounded"></div>
          </div>
          <div className="h-7 w-32 bg-slate-800 rounded-lg"></div>
        </div>
        <div className="h-[260px] bg-slate-800/30 rounded-xl"></div>
      </div>

      {/* Two Distribution Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="h-4 w-36 bg-slate-800 rounded"></div>
          <div className="h-[200px] bg-slate-800/30 rounded-xl"></div>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="h-4 w-36 bg-slate-800 rounded"></div>
          <div className="h-[200px] bg-slate-800/30 rounded-xl"></div>
        </div>
      </div>

      {/* Geographic & Tables Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="h-4 w-36 bg-slate-800 rounded"></div>
          <div className="h-[200px] bg-slate-800/30 rounded-xl"></div>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="h-4 w-36 bg-slate-800 rounded"></div>
          <div className="h-[200px] bg-slate-800/30 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}
