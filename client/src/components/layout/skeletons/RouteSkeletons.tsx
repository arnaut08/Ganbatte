import type { ReactNode } from 'react';

type SkeletonProps = {
  accent?: string;
};

export function ScreenFrame({ children, accent = '#70CFF8' }: SkeletonProps & { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 px-3 py-4 pb-20 sm:space-y-6 sm:px-4 sm:py-8 sm:pb-28 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] sm:h-11 sm:w-11" />
        <div className="space-y-1.5">
          <div className="h-3 w-32" style={{ backgroundColor: `${accent}4D` }} />
          <div className="h-6 w-52 bg-white/30 sm:w-72" />
        </div>
      </div>
      {children}
    </main>
  );
}

export function LearningIntroSkeleton({ accent = '#70CFF8' }: SkeletonProps) {
  return (
    <ScreenFrame accent={accent}>
      <section className="space-y-5 border-2 border-black border-l-8 bg-[#1f2637] p-3.5 shadow-[4px_4px_0px_0px_#000] sm:p-7" style={{ borderLeftColor: accent }}>
        <div className="space-y-2.5">
          <div className="h-5 w-32 border-2 border-black" style={{ backgroundColor: `${accent}4D` }} />
          <div className="h-8 w-64 bg-white/30 sm:w-80" />
          <div className="h-12 w-full bg-white/10" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-48 bg-white/20" />
          <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex h-20 gap-2.5 border-2 border-black bg-[#151922] p-2.5 sm:h-32 sm:flex-col sm:p-4" />
            ))}
          </div>
        </div>
        <div className="border-2 border-black bg-[#151922] p-3 sm:p-4">
          <div className="mb-2 h-3 w-44 bg-white/20" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[1, 2, 3, 4].map((rating) => <div key={rating} className="h-9 border-2 border-black bg-white/10" />)}
          </div>
        </div>
        <div className="h-11 w-full border-2 border-black" style={{ backgroundColor: `${accent}4D` }} />
      </section>
    </ScreenFrame>
  );
}

export function FriendsSkeleton() {
  return (
    <ScreenFrame accent="#70CFF8">
      <div className="grid gap-3.5 md:grid-cols-2 md:gap-6">
        <div className="space-y-3.5 sm:space-y-6">
          <section className="space-y-3 border-2 border-black border-l-8 border-l-[#70CFF8] bg-[#1f2637] p-3.5 shadow-[4px_4px_0px_0px_#000] sm:p-5">
            <div className="flex justify-between"><div className="h-5 w-24 bg-[#70CFF8]/40" /><div className="h-3 w-32 bg-[#70CFF8]/30" /></div>
            <div className="h-5 w-48 bg-white/30" />
            <div className="h-3 w-full bg-white/10" />
            <div className="h-11 border-2 border-black bg-[#151922]" />
            <div className="space-y-2 border-t-2 border-white/10 pt-3">
              {[1, 2].map((match) => <div key={match} className="h-12 border-2 border-black bg-[#151922]" />)}
            </div>
          </section>
          <section className="space-y-3 border-2 border-black border-l-8 border-l-[#FFDE59] bg-[#1f2637] p-3.5 shadow-[4px_4px_0px_0px_#000] sm:p-5">
            <div className="h-4 w-44 bg-[#FFDE59]/60" />
            {[1, 2].map((request) => <div key={request} className="h-12 border-2 border-black bg-[#151922]" />)}
          </section>
        </div>
        <section className="space-y-3 border-2 border-black border-l-8 border-l-[#A3E636] bg-[#1f2637] p-3.5 shadow-[4px_4px_0px_0px_#000] sm:p-5">
          <div className="flex justify-between border-b-2 border-white/10 pb-3"><div className="space-y-2"><div className="h-3 w-32 bg-[#A3E636]/60" /><div className="h-5 w-40 bg-white/30" /></div><div className="h-6 w-24 bg-[#151922]" /></div>
          {[1, 2, 3, 4].map((friend) => <div key={friend} className="h-14 border-2 border-black bg-[#151922]" />)}
        </section>
      </div>
    </ScreenFrame>
  );
}

export function RoomLobbySkeleton({ accent = '#FFDE59' }: SkeletonProps) {
  return (
    <ScreenFrame accent={accent}>
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-12">
        <div className="space-y-4 sm:space-y-5 lg:col-span-7">
          <section className="space-y-3 border-2 border-black border-l-8 bg-[#1f2637] p-5 text-center shadow-[4px_4px_0px_0px_#000] sm:p-7" style={{ borderLeftColor: accent }}>
            <div className="mx-auto h-3 w-36" style={{ backgroundColor: `${accent}66` }} />
            <div className="mx-auto h-16 w-52 border-2 border-black bg-[#151922] sm:h-20 sm:w-64" />
            <div className="mx-auto h-3 w-64 bg-white/10" />
          </section>
          <section className="space-y-3 border-2 border-black bg-[#1f2637] p-3.5 shadow-[3px_3px_0px_0px_#000] sm:p-4">
            <div className="h-3 w-40" style={{ backgroundColor: `${accent}99` }} />
            <div className="flex gap-2"><div className="h-10 flex-1 border-2 border-black bg-[#151922]" /><div className="h-10 w-20 border-2 border-black bg-white/20" /></div>
          </section>
          <section className="space-y-3 border-2 border-black bg-[#1f2637] p-3.5 shadow-[3px_3px_0px_0px_#000] sm:p-4"><div className="h-3 w-32" style={{ backgroundColor: `${accent}99` }} /><div className="h-10 border-2 border-black bg-[#151922]" /></section>
        </div>
        <div className="space-y-4 sm:space-y-5 lg:col-span-5">
          <section className="space-y-3 border-2 border-black bg-[#1f2637] p-4 shadow-[4px_4px_0px_0px_#000] sm:p-6"><div className="flex justify-between"><div className="h-4 w-24 bg-white/30" /><div className="h-5 w-28 bg-white/20" /></div>{[1, 2].map((player) => <div key={player} className="h-14 border-2 border-black bg-[#151922]" />)}<div className="grid grid-cols-2 gap-2"><div className="h-10 bg-white/20" /><div className="h-10" style={{ backgroundColor: `${accent}66` }} /></div></section>
          <section className="h-36 border-2 border-black bg-[#1f2637] p-4 shadow-[3px_3px_0px_0px_#000] sm:p-5" />
        </div>
      </div>
    </ScreenFrame>
  );
}

export function AssessmentSkeleton({ accent = '#FFDE59' }: SkeletonProps) {
  return (
    <ScreenFrame accent={accent}>
      <div className="space-y-3.5 sm:space-y-5">
        <header className="space-y-2.5"><div className="flex justify-between"><div className="space-y-1.5"><div className="h-3 w-32" style={{ backgroundColor: accent }} /><div className="h-6 w-64 bg-white/30" /></div><div className="h-6 w-24 border-2 border-black bg-white/20" /></div><div className="h-3 border-2 border-black bg-[#151922]"><div className="h-full w-1/4" style={{ backgroundColor: accent }} /></div></header>
        <section className="space-y-4 border-2 border-black border-l-8 bg-[#1f2637] p-4 shadow-[4px_4px_0px_0px_#000] sm:p-6" style={{ borderLeftColor: accent }}>
          <div className="border-2 border-black bg-[#151922] p-4 sm:p-7"><div className="flex justify-between border-b border-white/10 pb-3"><div className="h-5 w-32" style={{ backgroundColor: accent }} /><div className="h-5 w-20 bg-white/10" /></div><div className="mx-auto my-8 h-16 w-40 border-2 border-black bg-white/15 sm:h-24 sm:w-56" /><div className="mx-auto h-3 w-48 bg-white/20" /></div>
          <div className="flex gap-2 sm:gap-3"><div className="h-10 flex-1 border-2 border-black bg-[#151922] sm:h-13" /><div className="h-10 w-24 border-2 border-black" style={{ backgroundColor: `${accent}4D` }} /></div>
          <div className="h-16 border-2 border-black bg-[#151922]" />
        </section>
      </div>
    </ScreenFrame>
  );
}

export function ResultsSkeleton({ accent = '#A3E636' }: SkeletonProps) {
  return (
    <ScreenFrame accent={accent}>
      <div className="space-y-3.5 sm:space-y-6">
        <header className="flex justify-between gap-2"><div className="space-y-2"><div className="h-3 w-32" style={{ backgroundColor: `${accent}B3` }} /><div className="h-7 w-64 bg-white/30" /></div><div className="flex gap-2"><div className="h-6 w-20 bg-[#151922]" /><div className="h-6 w-24" style={{ backgroundColor: `${accent}66` }} /></div></header>
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-4">{[1, 2].map((player) => <section key={player} className="h-44 border-2 border-black bg-[#1f2637] p-4 shadow-[3px_3px_0px_0px_#000] sm:h-52 sm:p-5"><div className="flex justify-between"><div className="h-5 w-24" style={{ backgroundColor: `${accent}66` }} /><div className="h-4 w-8 bg-white/20" /></div><div className="my-5 h-10 w-32 bg-white/30" /><div className="h-3 w-full bg-white/10" /></section>)}</div>
        <div className="flex justify-center gap-2"><div className="h-10 w-32 bg-white/20" /><div className="h-10 w-32" style={{ backgroundColor: `${accent}66` }} /></div>
        <section className="space-y-3 pt-2"><div className="h-4 w-48" style={{ backgroundColor: `${accent}B3` }} />{[1, 2, 3].map((card) => <div key={card} className="h-24 border-2 border-black bg-[#1f2637] shadow-[2px_2px_0px_0px_#000]" />)}</section>
      </div>
    </ScreenFrame>
  );
}
