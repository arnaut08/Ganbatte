import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LearningScreen({ onBackToHome, onOpenKanjiStudy, onOpenGrammarStudy }) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBackToHome}
          className="flex h-11 w-11 items-center justify-center border-2 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          title="Back to home"
        >
          <span className="font-mono text-lg font-black">&lt;</span>
        </button>

        <div className="flex flex-col justify-center">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
            // SECTION: LEARNING
          </span>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">
            Study Japanese Characters
          </h2>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 01 - Kana (Locked) */}
        <Card className="relative flex flex-col justify-between overflow-hidden border-2 border-black bg-[#1a1f2c] p-6 opacity-85 shadow-[6px_6px_0px_0px_#000000]">
          <span className="pointer-events-none absolute -bottom-6 -right-3 select-none font-mono text-[130px] font-black leading-none text-white/[0.04]">
            仮
          </span>

          <CardHeader className="relative z-10 p-0 pb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="border-2 border-black bg-[#2c3345] px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-neutral-400">
                01 // Kana
              </span>
              <span className="font-mono text-xs font-bold text-neutral-500">
                [LOCKED]
              </span>
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight text-white">
              Kana
            </CardTitle>
            <CardDescription className="mt-2 text-sm font-semibold text-neutral-400 leading-relaxed">
              Learn the two Japanese syllabaries: Hiragana and Katakana.
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10 p-0 pt-4">
            <Button
              variant="neutral"
              disabled
              className="w-full border-2 border-black bg-neutral-800 py-5 text-sm font-black uppercase tracking-wider text-neutral-500 shadow-none cursor-not-allowed"
            >
              Coming Soon...
            </Button>
          </CardContent>
        </Card>

        {/* Card 02 - Kanji (Available) */}
        <Card className="relative flex flex-col justify-between overflow-hidden border-2 border-black bg-[#FFDE59] p-6 shadow-[6px_6px_0px_0px_#000000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000000]">
          <span className="pointer-events-none absolute -bottom-6 -right-3 select-none font-mono text-[130px] font-black leading-none text-black/[0.08]">
            漢
          </span>

          <CardHeader className="relative z-10 p-0 pb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="border-2 border-black bg-black px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#FFDE59]">
                02 // Kanji
              </span>
              <span className="border-2 border-black bg-[#A3E636] px-1.5 py-0.5 font-mono text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000]">
                AVAILABLE
              </span>
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight text-black">
              N5 Kanji
            </CardTitle>
            <CardDescription className="mt-2 text-sm font-bold text-black/80 leading-relaxed">
              Review essential N5 Kanji grouped by everyday themes with flashcards.
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10 p-0 pt-4">
            <Button
              onClick={onOpenKanjiStudy}
              className="w-full border-2 border-black bg-white py-5 text-sm font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000000] hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Study Now →
            </Button>
          </CardContent>
        </Card>

        {/* Card 03 - Grammar (Available - Fixed) */}
        <Card className="relative flex flex-col justify-between overflow-hidden border-2 border-black bg-[#70CFF8] p-6 shadow-[6px_6px_0px_0px_#000000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000000]">
          <span className="pointer-events-none absolute -bottom-6 -right-3 select-none font-mono text-[130px] font-black leading-none text-black/[0.08]">
            文
          </span>

          <CardHeader className="relative z-10 p-0 pb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="border-2 border-black bg-black px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#70CFF8]">
                03 // Grammar
              </span>
              <span className="border-2 border-black bg-[#A3E636] px-1.5 py-0.5 font-mono text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000]">
                AVAILABLE
              </span>
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight text-black">
              Genki Grammar
            </CardTitle>
            <CardDescription className="mt-2 text-sm font-bold text-black/80 leading-relaxed">
              Genki Volume 1 lessons summarized in progressive learning blocks.
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10 p-0 pt-4">
            <Button
              onClick={onOpenGrammarStudy}
              className="w-full border-2 border-black bg-white py-5 text-sm font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000000] hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Study Now →
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
