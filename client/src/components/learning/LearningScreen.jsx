import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LearningScreen({ onBackToHome, onOpenKanaStudy, onOpenKanjiStudy, onOpenGrammarStudy }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBackToHome}
          className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          title="Back to home"
        >
          <span className="font-mono text-lg font-black">&lt;</span>
        </button>

        <div className="flex flex-col justify-center">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
        // SECTION: LEARNING
          </span>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-tight sm:text-3xl">
            Study Japanese Modules
          </h2>
        </div>
      </div>

      {/* Balanced 3-Column Neo-Brutalist Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 01 - Kana (Cyan) */}
        <Card className="group relative flex min-h-[380px] flex-col justify-between overflow-hidden border-2 border-black bg-[#70CFF8] p-6 shadow-[6px_6px_0px_0px_#000000] transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#000000]">
          {/* Background Watermark Kanji */}
          <span className="pointer-events-none absolute -bottom-5 -right-3 select-none font-black text-[130px] leading-none text-black/[0.08] transition-transform duration-200 group-hover:scale-105">
            仮
          </span>

          <CardHeader className="relative z-10 p-0">
            <div className="mb-4 flex items-center justify-between">
              <span className="border-2 border-black bg-black px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-[#70CFF8] shadow-[2px_2px_0px_0px_#000000]">
                01 // Kana
              </span>
              <span className="border-2 border-black bg-[#A3E636] px-2 py-0.5 font-mono text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000]">
                AVAILABLE
              </span>
            </div>

            <CardTitle className="text-3xl font-black uppercase tracking-tight text-black">
              Kana
            </CardTitle>
            <CardDescription className="mt-2 text-sm font-bold leading-relaxed text-black/85">
              Study Hiragana and Katakana characters with romaji readings and example vocabulary.
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10 p-0 pt-6">
            <Button
              onClick={onOpenKanaStudy}
              className="w-full border-2 border-black bg-white py-5 text-xs font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-neutral-100 group-hover:shadow-[5px_5px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Study Now →
            </Button>
          </CardContent>
        </Card>

        {/* Card 02 - Kanji (Yellow) */}
        <Card className="group relative flex min-h-[380px] flex-col justify-between overflow-hidden border-2 border-black bg-[#FFDE59] p-6 shadow-[6px_6px_0px_0px_#000000] transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#000000]">
          <span className="pointer-events-none absolute -bottom-5 -right-3 select-none font-black text-[130px] leading-none text-black/[0.08] transition-transform duration-200 group-hover:scale-105">
            漢
          </span>

          <CardHeader className="relative z-10 p-0">
            <div className="mb-4 flex items-center justify-between">
              <span className="border-2 border-black bg-black px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-[#FFDE59] shadow-[2px_2px_0px_0px_#000000]">
                02 // Kanji
              </span>
              <span className="border-2 border-black bg-[#A3E636] px-2 py-0.5 font-mono text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000]">
                AVAILABLE
              </span>
            </div>

            <CardTitle className="text-3xl font-black uppercase tracking-tight text-black">
              N5 Kanji
            </CardTitle>
            <CardDescription className="mt-2 text-sm font-bold leading-relaxed text-black/85">
              Review essential N5 Kanji grouped by daily life themes with interactive flashcards.
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10 p-0 pt-6">
            <Button
              onClick={onOpenKanjiStudy}
              className="w-full border-2 border-black bg-white py-5 text-xs font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-neutral-100 group-hover:shadow-[5px_5px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Study Now →
            </Button>
          </CardContent>
        </Card>

        {/* Card 03 - Grammar (Coral Orange/Red) */}
        <Card className="group relative flex min-h-[380px] flex-col justify-between overflow-hidden border-2 border-black bg-[#FF6B6B] p-6 shadow-[6px_6px_0px_0px_#000000] transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#000000] md:col-span-2 lg:col-span-1">
          <span className="pointer-events-none absolute -bottom-5 -right-3 select-none font-black text-[130px] leading-none text-black/[0.08] transition-transform duration-200 group-hover:scale-105">
            文
          </span>

          <CardHeader className="relative z-10 p-0">
            <div className="mb-4 flex items-center justify-between">
              <span className="border-2 border-black bg-black px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-[#FF6B6B] shadow-[2px_2px_0px_0px_#000000]">
                03 // Grammar
              </span>
              <span className="border-2 border-black bg-[#A3E636] px-2 py-0.5 font-mono text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000]">
                AVAILABLE
              </span>
            </div>

            <CardTitle className="text-3xl font-black uppercase tracking-tight text-black">
              Grammar
            </CardTitle>
            <CardDescription className="mt-2 text-sm font-bold leading-relaxed text-black/85">
              Genki Volume 1 lessons broken down into step-by-step grammatical pattern blocks.
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10 p-0 pt-6">
            <Button
              onClick={onOpenGrammarStudy}
              className="w-full border-2 border-black bg-white py-5 text-xs font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-neutral-100 group-hover:shadow-[5px_5px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Study Now →
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
