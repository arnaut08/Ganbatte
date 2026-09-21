import type { SupabaseClient } from '@supabase/supabase-js';
import { generateGrammarAssessment } from './genki-grammar-service.js';

export type TugOfWarState = {
  momentum: number;
  currentSentence: string;
  options: string[];
  targetAnswer: string;
  hostLockoutUntil: number | null;
  guestLockoutUntil: number | null;
  winningThreshold: number;
};

type GrammarExample = { japanese: string };

const PARTICLES = ['は', 'を', 'に', 'で', 'へ', 'が', 'と', 'も', 'の'];
const WINNING_THRESHOLD = 5;

function shuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function collectExamples(value: unknown, examples: GrammarExample[] = []): GrammarExample[] {
  if (Array.isArray(value)) {
    value.forEach((item) => collectExamples(item, examples));
  } else if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const japanese = record.japanese ?? record.japaneseSentence ?? record.jp;
    if (typeof japanese === 'string' && japanese.trim()) examples.push({ japanese: japanese.trim() });
    Object.values(record).forEach((item) => collectExamples(item, examples));
  }
  return examples;
}

function buildRound(sentence: string, targetAnswer: string): TugOfWarState {
  const answer = targetAnswer.trim();
  const blankIndex = sentence.indexOf(answer);
  const currentSentence = blankIndex >= 0
    ? `${sentence.slice(0, blankIndex)}___${sentence.slice(blankIndex + answer.length)}`
    : sentence;
  const decoys = PARTICLES.filter((particle) => particle !== answer).slice(0, 3);

  return {
    momentum: 0,
    currentSentence,
    options: shuffle([answer, ...decoys]),
    targetAnswer: answer,
    hostLockoutUntil: null,
    guestLockoutUntil: null,
    winningThreshold: WINNING_THRESHOLD,
  };
}

function findParticle(sentence: string): string | null {
  return PARTICLES.find((particle) => sentence.includes(particle)) ?? null;
}

export async function generateTugOfWarRound(
  supabase: SupabaseClient,
  maxLesson = 3,
): Promise<TugOfWarState> {
  const { data, error } = await supabase
    .from('grammar_lessons')
    .select('content')
    .eq('status', 'published')
    .lte('lesson_number', Math.min(Math.max(maxLesson, 1), 12));

  if (error) throw error;

  const examples = collectExamples(data)
    .filter((example, index, all) => all.findIndex((candidate) => candidate.japanese === example.japanese) === index)
    .map((example) => ({ ...example, particle: findParticle(example.japanese) }))
    .filter((example): example is GrammarExample & { particle: string } => Boolean(example.particle));

  if (examples.length > 0) {
    const example = examples[Math.floor(Math.random() * examples.length)];
    return buildRound(example.japanese, example.particle);
  }

  const generatedQuestions = await generateGrammarAssessment({ maxLesson, count: 10, mode: 'practice' });
  const question = generatedQuestions.find((candidate) => (
    candidate.type === 'multiple-choice'
    && typeof candidate.prompt === 'string'
    && typeof candidate.correctAnswer === 'string'
    && Array.isArray(candidate.choices)
  ));
  if (!question) throw new Error('No N5 grammar questions are available for Tug of War.');

  const targetAnswer = String(question.correctAnswer);
  const questionChoices = (question.choices as unknown[]).filter((choice): choice is string => typeof choice === 'string');
  const options = Array.from(new Set([targetAnswer, ...questionChoices, ...PARTICLES]));
  const state = buildRound(String(question.prompt), targetAnswer);
  state.options = shuffle(options.slice(0, 4));
  return state;
}
