import type { ReactNode } from 'react';

type SkeletonProps = {
  accent?: string;
};

export function ScreenFrame({ children, accent = '#70CFF8' }: SkeletonProps & { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 px-3 py-4 pb-20 sm:space-y-6 sm:px-4 sm:py-8 sm:pb-28 animate-pulse">
      <div className="flex items-center gap-2.5 sm:gap-4">
        <div className="h-9 w-9 shrink-0 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] sm:h-11 sm:w-11" />
        <div className="flex flex-col -mt-1 sm:-mt-1.5 justify-center text-left">
          <div className="h-3 w-32" style={{ backgroundColor: `${accent}4D` }} />
          <div className="mt-0.5 h-6 w-52 bg-white/30 sm:h-8 sm:w-72" />
        </div>
      </div>
      {children}
    </main>
  );
}

type LearningIntroDeck = 'kana' | 'kanji' | 'vocab' | 'grammar';

export function LearningIntroSkeleton({ accent = '#70CFF8', deck = 'kanji' }: SkeletonProps & { deck?: LearningIntroDeck }) {
  const isKana = deck === 'kana';
  const isGrammar = deck === 'grammar';

  return (
    <main className="mx-auto w-full max-w-4xl px-3 py-3 pb-20 sm:px-4 sm:py-8 sm:pb-24 animate-pulse">
      <header className="mb-3 flex items-start gap-2.5 sm:mb-6 sm:gap-4">
        <div className="h-8 w-8 shrink-0 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] sm:h-11 sm:w-11 sm:shadow-[3px_3px_0px_0px_#000]" />
        <div className="flex flex-col -mt-1 sm:-mt-1.5 text-left">
          <div className="h-2.5 w-36 bg-white/20 sm:h-3 sm:w-48" />
          <div className="mt-0.5 h-5 w-56 bg-white/30 sm:h-8 sm:w-80" />
        </div>
      </header>

      <section
        className="space-y-3 border-2 border-black border-l-6 bg-[#1f2637] p-3.5 text-white shadow-[3.5px_3.5px_0px_0px_#000] sm:space-y-5 sm:border-l-8 sm:p-7 sm:shadow-[6px_6px_0px_0px_#000]"
        style={{ borderLeftColor: accent }}
      >
        <div>
          <div className="h-4 w-32 border-2 border-black" style={{ backgroundColor: `${accent}4D` }} />
          <div className="mt-1.5 h-6 w-64 bg-white/30 sm:h-8 sm:w-80" />
          <div className="mt-1 space-y-1">
            <div className="h-3 w-full bg-white/10" />
            <div className="h-3 w-full bg-white/10" />
            <div className="h-3 w-11/12 bg-white/10 sm:hidden" />
            <div className="h-3 w-3/4 bg-white/10 sm:hidden" />
          </div>
        </div>

        <div className="min-h-[220px] space-y-1.5 sm:min-h-[140px] sm:space-y-2">
          <div className="h-3 w-48 bg-white/20" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-start gap-2.5 border-2 border-black bg-[#151922] p-2.5 sm:min-h-[112px] sm:flex-col sm:gap-0 sm:p-4">
                <div className="h-5 w-8 shrink-0 border border-black" style={{ backgroundColor: `${accent}66` }} />
                <div className="min-w-0 flex-1 space-y-1 sm:mt-2">
                  <div className="h-3 w-16 bg-white/20" />
                  <div className="h-2.5 w-full bg-white/10" />
                  <div className="h-2.5 w-5/6 bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {isKana ? (
          <>
            <div className="min-h-[164px] border-2 border-black bg-[#151922] p-3 shadow-[2px_2px_0px_0px_#000] sm:min-h-[82px] sm:p-4">
              <div className="mb-2 h-3 w-44 bg-white/20" />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                {[1, 2, 3].map((rating) => (
                  <div key={rating} className="flex items-center gap-2.5">
                    <div className="h-9 w-9 shrink-0 border-2 border-black bg-white/10" />
                    <div className="space-y-1"><div className="h-3 w-28 bg-white/20" /><div className="h-2.5 w-32 bg-white/10" /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="min-h-[116px] border-2 border-black border-l-4 bg-[#151922] p-3 shadow-[2px_2px_0px_0px_#000] sm:min-h-[96px] sm:p-4" style={{ borderLeftColor: accent }}>
              <div className="h-3 w-48" style={{ backgroundColor: `${accent}99` }} />
              <div className="mt-1 flex flex-wrap gap-1.5 sm:gap-2">
                {[1, 2, 3].map((scope) => <div key={scope} className="h-5 w-16 border-2 border-black bg-[#1f2637]" />)}
              </div>
              <div className="mt-1 space-y-1"><div className="h-3 w-full bg-white/10" /><div className="h-3 w-5/6 bg-white/10" /></div>
            </div>
          </>
        ) : isGrammar ? (
          <>
            <div className="min-h-[92px] border-2 border-black bg-[#151922] p-3 shadow-[2px_2px_0px_0px_#000] sm:min-h-[86px] sm:p-4">
              <div className="mb-2 h-3 w-52 bg-white/20" />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                {[1, 2].map((rating) => (
                  <div key={rating} className="flex items-start gap-2.5 border-2 border-black bg-[#1f2637] p-2.5 sm:p-3">
                    <div className="h-7 w-7 shrink-0 border-2 border-black bg-white/10" />
                    <div className="space-y-1"><div className="h-3 w-24 bg-white/20" /><div className="h-2.5 w-full bg-white/10" /><div className="h-2.5 w-5/6 bg-white/10" /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="min-h-[112px] border-2 border-black bg-[#151922] p-3 shadow-[2px_2px_0px_0px_#000] sm:min-h-[102px] sm:p-4">
              <div className="h-3 w-40" style={{ backgroundColor: `${accent}99` }} />
              <div className="mt-1.5 flex flex-wrap gap-1.5 sm:gap-2">
                {[1, 2, 3].map((scope) => <div key={scope} className="h-5 w-20 border-2 border-black bg-[#1f2637]" />)}
              </div>
              <div className="mt-1 space-y-1"><div className="h-3 w-full bg-white/10" /><div className="h-3 w-5/6 bg-white/10" /></div>
            </div>
          </>
        ) : (
          <>
            <div className="min-h-[100px] border-2 border-black bg-[#151922] p-3 shadow-[2px_2px_0px_0px_#000] sm:min-h-[78px] sm:p-4">
              <div className="mb-2 h-3 w-44 bg-white/20" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
                {[1, 2, 3, 4].map((rating) => <div key={rating} className="h-8 border-2 border-black bg-white/10 sm:h-9" />)}
              </div>
            </div>
            <div className="border-2 border-black border-l-4 bg-[#151922] p-3 shadow-[2px_2px_0px_0px_#000] sm:p-4" style={{ borderLeftColor: accent }}>
              <div className="h-3 w-48" style={{ backgroundColor: `${accent}99` }} />
              <div className="mt-1 space-y-1"><div className="h-3 w-full bg-white/10" /><div className="h-3 w-5/6 bg-white/10" /></div>
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 border-t-2 border-black/40 pt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-4">
          <div className="space-y-1">
            <div className="h-3 w-32 bg-white/20" />
            <div className="h-2.5 w-52 bg-white/10" />
          </div>
          <div className="h-10 w-full border-2 border-black bg-white/20 sm:w-36" />
        </div>
      </section>
    </main>
  );
}

export function FriendsSkeleton() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-3 px-3 py-3 pb-20 animate-pulse sm:space-y-6 sm:px-4 sm:py-8 sm:pb-28">
      <header className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5 sm:gap-4">
          <div className="h-8 w-8 shrink-0 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] sm:h-11 sm:w-11 sm:shadow-[3px_3px_0px_0px_#000]" />
          <div className="flex flex-col -mt-1 sm:-mt-1.5 text-left">
            <div className="h-2.5 w-44 bg-[#70CFF8]/50 sm:h-3 sm:w-56" />
            <div className="mt-0.5 h-5 w-56 bg-white/30 sm:h-8 sm:w-72" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 self-start pl-10 sm:gap-2 sm:self-auto sm:pl-0">
          <div className="h-6 w-20 border-2 border-black bg-[#A3E636]/50 sm:h-7 sm:w-24" />
          <div className="h-6 w-20 border-2 border-black bg-white/30 sm:h-7 sm:w-24" />
        </div>
      </header>

      <div className="grid gap-3.5 sm:gap-6 md:grid-cols-2 md:items-start">
        <div className="space-y-3.5 sm:space-y-6">
          <section className="border-2 border-black border-l-6 border-l-[#70CFF8] bg-[#1f2637] p-3.5 text-white shadow-[3.5px_3.5px_0px_0px_#000] sm:border-l-8 sm:p-5 sm:shadow-[6px_6px_0px_0px_#000]">
            <div className="mb-1.5 flex items-center justify-between sm:mb-3">
              <div className="h-4 w-24 border-2 border-black bg-[#70CFF8]/60 sm:h-5 sm:w-28" />
              <div className="h-3 w-32 bg-[#70CFF8]/30" />
            </div>
            <div className="h-5 w-48 bg-white/30 sm:h-6 sm:w-56" />
            <div className="mt-0.5 h-3 w-full bg-white/10" />
            <div className="mt-2.5 h-9 w-full border-2 border-black bg-[#151922] sm:mt-4 sm:h-11" />
          </section>

          <section className="border-2 border-black border-l-6 border-l-[#FFDE59] bg-[#1f2637] p-3.5 text-white shadow-[3px_3px_0px_0px_#000] sm:border-l-8 sm:p-5 sm:shadow-[4px_4px_0px_0px_#000]">
            <div className="mb-2 flex items-center justify-between border-b-2 border-white/10 pb-2 sm:mb-3">
              <div className="h-3 w-40 bg-[#FFDE59]/60 sm:h-4 sm:w-48" />
              <div className="h-5 w-16 border-2 border-black bg-[#FFDE59]/50" />
            </div>
            {[1, 2].map((request) => <div key={request} className="mb-2 h-12 border-2 border-black bg-[#151922] sm:h-14" />)}
          </section>
        </div>

        <section className="border-2 border-black border-l-6 border-l-[#A3E636] bg-[#1f2637] p-3.5 text-white shadow-[3.5px_3.5px_0px_0px_#000] sm:border-l-8 sm:p-5 sm:shadow-[6px_6px_0px_0px_#000]">
          <div className="mb-2.5 flex items-center justify-between border-b-2 border-white/10 pb-2 sm:mb-4 sm:pb-3">
            <div><div className="h-3 w-32 bg-[#A3E636]/60" /><div className="mt-1 h-5 w-40 bg-white/30 sm:h-6 sm:w-48" /></div>
            <div className="h-6 w-24 border-2 border-black bg-[#151922] sm:h-7 sm:w-28" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((friend) => <div key={friend} className="h-14 border-2 border-black bg-[#151922] sm:h-16" />)}
          </div>
        </section>
      </div>
    </main>
  );
}

export function RoomLobbySkeleton({ accent = '#FFDE59' }: SkeletonProps) {
  return (
    <main className="mx-auto max-w-5xl px-3 py-4 pb-20 animate-pulse sm:px-4 sm:py-8 sm:pb-28">
      <header className="mb-4 flex items-center gap-2.5 sm:mb-6 sm:gap-4">
        <div className="h-9 w-9 shrink-0 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] sm:h-11 sm:w-11 sm:shadow-[3px_3px_0px_0px_#000]" />
        <div className="flex flex-col justify-center text-left"><div className="h-3 w-40 sm:w-52" style={{ backgroundColor: `${accent}99` }} /><div className="mt-0.5 h-6 w-48 bg-white/30 sm:h-8 sm:w-64" /></div>
      </header>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-12 lg:items-start">
        <div className="space-y-4 sm:space-y-5 lg:col-span-7">
          <section className="flex flex-col items-center justify-center border-2 border-black border-l-8 bg-[#1f2637] p-5 text-center text-white shadow-[4px_4px_0px_0px_#000] sm:p-7 sm:shadow-[6px_6px_0px_0px_#000]" style={{ borderLeftColor: accent }}>
            <div className="h-3 w-36" style={{ backgroundColor: `${accent}99` }} />
            <div className="my-2.5 h-16 w-52 border-2 border-black bg-[#151922] sm:my-3 sm:h-20 sm:w-64" />
            <div className="h-3 w-64 bg-white/10" />
          </section>

          <section className="border-2 border-black bg-[#1f2637] p-3.5 shadow-[3px_3px_0px_0px_#000] sm:p-4">
            <div className="h-3 w-40" style={{ backgroundColor: `${accent}99` }} />
            <div className="mt-1.5 flex gap-2 sm:gap-2.5"><div className="h-9 min-w-0 flex-1 border-2 border-black bg-[#151922] sm:h-10" /><div className="h-9 w-20 border-2 border-black bg-white/20 sm:h-10" /></div>
          </section>

          <section className="border-2 border-black bg-[#1f2637] p-3.5 shadow-[3px_3px_0px_0px_#000] sm:p-4">
            <div className="h-3 w-32" style={{ backgroundColor: `${accent}99` }} />
            <div className="mt-1.5 h-10 w-full border-2 border-black bg-[#151922]" />
          </section>
        </div>

        <div className="space-y-4 sm:space-y-5 lg:col-span-5">
          <section className="border-2 border-black bg-[#1f2637] p-4 text-white shadow-[4px_4px_0px_0px_#000] sm:p-6 sm:shadow-[6px_6px_0px_0px_#000]">
            <div className="mb-3 flex items-center justify-between border-b-2 border-white/10 pb-2.5 sm:mb-4 sm:pb-3"><div className="h-4 w-24 bg-white/30" /><div className="h-5 w-28 bg-white/20" /></div>
            <div className="space-y-2.5">{[1, 2].map((player) => <div key={player} className="h-14 border-2 border-black bg-[#151922] sm:h-16" />)}</div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3"><div className="h-10 border-2 border-black bg-white/20 sm:h-11" /><div className="h-10 border-2 border-black" style={{ backgroundColor: `${accent}66` }} /></div>
          </section>
          <section className="border-2 border-black bg-[#1f2637] p-4 shadow-[3px_3px_0px_0px_#000] sm:p-5 sm:shadow-[4px_4px_0px_0px_#000]">
            <div className="h-3 w-32" style={{ backgroundColor: `${accent}99` }} />
            <div className="mt-2 space-y-2"><div className="h-3 w-full bg-white/10" /><div className="h-3 w-5/6 bg-white/10" /><div className="h-3 w-4/5 bg-white/10" /><div className="h-3 w-3/4 bg-white/10" /></div>
          </section>
        </div>
      </div>
    </main>
  );
}

export function AssessmentSkeleton({ accent = '#FFDE59' }: SkeletonProps) {
  return (
    <main className="container mx-auto max-w-3xl space-y-3.5 px-3 py-3 pb-20 animate-pulse sm:space-y-5 sm:px-4 sm:py-6 sm:pb-28">
      <div className="space-y-2 sm:space-y-3">
        <header>
          <div className="flex items-center justify-between gap-2">
            <div><div className="h-3 w-32" style={{ backgroundColor: accent }} /><div className="mt-0.5 h-5 w-56 bg-white/30 sm:h-7 sm:w-64" /></div>
            <div className="h-6 w-24 shrink-0 border-2 border-black bg-white/20 sm:h-7 sm:w-28" />
          </div>
          <div className="mt-2 h-3 w-full border-2 border-black bg-[#151922] sm:mt-3"><div className="h-full w-1/4" style={{ backgroundColor: accent }} /></div>
        </header>
      </div>

      <section className="relative border-2 border-black border-l-8 bg-[#1f2637] p-4 shadow-[4px_4px_0px_0px_#000] sm:p-6 sm:shadow-[6px_6px_0px_0px_#000]" style={{ borderLeftColor: accent }}>
        <div className="relative border-2 border-black bg-[#151922] p-4 shadow-[3px_3px_0px_0px_#000] sm:p-7">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5"><div className="h-4 w-28" style={{ backgroundColor: accent }} /><div className="h-4 w-24 bg-white/10" /></div>
          <div className="my-4 h-12 w-full bg-white/10 sm:my-6 sm:h-16" />
          <div className="mx-auto h-3 w-48 bg-white/20" />
        </div>
        <div className="mt-4 flex gap-2 sm:mt-6 sm:gap-3"><div className="h-10 min-w-0 flex-1 border-2 border-black bg-[#151922] sm:h-13" /><div className="h-10 w-[100px] border-2 border-black bg-white/20 sm:h-13 sm:w-[130px]" /></div>
        <div className="mt-4 flex items-center justify-between border-t-2 border-white/10 pt-3 sm:mt-5 sm:pt-4"><div className="h-6 w-12 border-2 border-black bg-white/20" /><div className="h-8 w-48 border-2 border-black bg-[#151922] sm:h-9 sm:w-56" /><div className="h-3 w-16 bg-white/10" /></div>
      </section>
    </main>
  );
}

export function ResultsSkeleton({ accent = '#A3E636' }: SkeletonProps) {
  return (
    <main className="container mx-auto max-w-4xl space-y-3.5 px-3 py-3 pb-20 animate-pulse sm:space-y-6 sm:px-4 sm:py-6 sm:pb-28">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="h-3 w-32" style={{ backgroundColor: `${accent}B3` }} /><div className="mt-0.5 h-5 w-52 bg-white/30 sm:h-7 sm:w-64" /></div>
        <div className="flex items-center gap-1.5 self-start sm:gap-2 sm:self-auto"><div className="h-6 w-20 border-2 border-black bg-[#151922] sm:h-7 sm:w-24" /><div className="h-6 w-24 border-2 border-black sm:h-7 sm:w-28" style={{ backgroundColor: `${accent}66` }} /></div>
      </header>

      <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-4">
        {[1, 2].map((player) => <section key={player} className="relative flex h-44 flex-col justify-between border-2 border-black bg-[#1f2637] p-3.5 shadow-[3px_3px_0px_0px_#000] sm:h-52 sm:p-5 sm:shadow-[6px_6px_0px_0px_#000]"><div className="flex justify-between"><div className="h-5 w-24 border-2 border-black" style={{ backgroundColor: `${accent}66` }} /><div className="h-4 w-8 bg-white/20" /></div><div><div className="h-5 w-40 bg-white/20" /><div className="mt-1 h-10 w-24 bg-white/30 sm:h-14 sm:w-32" /></div><div className="h-3 w-full bg-white/10" /></section>)}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 sm:gap-3 sm:pt-2"><div className="h-9 w-32 border-2 border-black bg-white/20 sm:h-11" /><div className="h-9 w-32 border-2 border-black sm:h-11" style={{ backgroundColor: `${accent}66` }} /></div>

      <section className="space-y-2.5 pt-2 sm:space-y-4 sm:pt-4"><div className="h-4 w-48" style={{ backgroundColor: `${accent}B3` }} />{[1, 2, 3].map((card) => <div key={card} className="h-24 border-2 border-black bg-[#1f2637] shadow-[2px_2px_0px_0px_#000] sm:h-28 sm:shadow-[4px_4px_0px_0px_#000]" />)}</section>
    </main>
  );
}
