import React from 'react';

export function HomeSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center pt-8 pb-16 animate-pulse">
      {/* Top Pill Badge */}
      <div className="h-6 w-72 bg-white/10 rounded-full border border-white/15 mb-6" />

      {/* Hero Title */}
      <div className="h-10 sm:h-12 w-3/4 max-w-xl bg-white/20 rounded-md mb-4" />

      {/* Subtitle Lines */}
      <div className="space-y-2 w-full max-w-md flex flex-col items-center mb-10">
        <div className="h-3.5 w-full bg-white/10 rounded" />
        <div className="h-3.5 w-2/3 bg-white/10 rounded" />
      </div>

      {/* Two Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {/* Foundation Card Skeleton */}
        <div className="h-64 rounded-none border-2 border-black/40 bg-white/5 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-5 w-28 bg-white/15 rounded" />
              <div className="h-4 w-20 bg-white/10 rounded" />
            </div>
            <div className="h-7 w-36 bg-white/20 rounded" />
            <div className="space-y-2 pt-2">
              <div className="h-3 w-full bg-white/10 rounded" />
              <div className="h-3 w-4/5 bg-white/10 rounded" />
            </div>
          </div>
          <div className="h-11 w-full bg-white/15 border-2 border-black/30 rounded-none" />
        </div>

        {/* Assessment Card Skeleton */}
        <div className="h-64 rounded-none border-2 border-black/40 bg-white/5 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-5 w-28 bg-white/15 rounded" />
              <div className="h-4 w-20 bg-white/10 rounded" />
            </div>
            <div className="h-7 w-44 bg-white/20 rounded" />
            <div className="space-y-2 pt-2">
              <div className="h-3 w-full bg-white/10 rounded" />
              <div className="h-3 w-4/5 bg-white/10 rounded" />
            </div>
          </div>
          <div className="h-11 w-full bg-white/15 border-2 border-black/30 rounded-none" />
        </div>
      </div>
    </div>
  );
}