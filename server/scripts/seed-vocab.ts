import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '../config/env.js';
import { generateStageVocab, N5_CURRICULUM_STAGES } from '../services/gemini-vocab-service.js';

dotenv.config({ path: new URL('../.env', import.meta.url) });

const SEED_GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_REQUEST_DELAY_MS = 5000;

function getSelectedStages() {
  const stagesArgument = process.argv.find((argument) => argument.startsWith('--stages='));
  if (!stagesArgument) return N5_CURRICULUM_STAGES;

  const requestedStages = stagesArgument.slice('--stages='.length).split(',')
    .map((value) => Number(value.trim()));
  const validStages = new Set<number>(N5_CURRICULUM_STAGES.map((stageItem) => stageItem.stage));
  const invalidStage = requestedStages.find((stageNumber) => !Number.isInteger(stageNumber) || !validStages.has(stageNumber));
  if (invalidStage !== undefined) {
    throw new Error(`Invalid N5 stage: ${invalidStage}. Choose stages from 1-${N5_CURRICULUM_STAGES.length}.`);
  }

  return N5_CURRICULUM_STAGES.filter((stageItem) => requestedStages.includes(stageItem.stage));
}

function formatSeedError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const details = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
    const parts = [details.message, details.code, details.details, details.hint]
      .filter((part): part is string => typeof part === 'string' && part.length > 0);
    if (parts.length > 0) return parts.join(' | ');
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown object error';
    }
  }
  return String(error);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env');
  process.exitCode = 1;
} else {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

  async function seedN5Curriculum(): Promise<void> {
    const selectedStages = getSelectedStages();
    console.log(`Starting N5 vocabulary seed (${selectedStages.length} stage${selectedStages.length === 1 ? '' : 's'})...`);
    let totalUpserted = 0;
    let failedStages = 0;

    for (const [stageIndex, stageItem] of selectedStages.entries()) {
      console.log(`[Stage ${stageItem.stage} (${stageIndex + 1}/${selectedStages.length})] Generating ${stageItem.theme}...`);

      try {
        const vocabItems = await generateStageVocab({
          level: 'N5',
          model: SEED_GEMINI_MODEL,
          stageNumber: stageItem.stage,
          totalStages: N5_CURRICULUM_STAGES.length,
          theme: stageItem.theme,
          focusAreas: stageItem.focus,
          targetCount: 25,
        });

        const records = vocabItems.map((item) => ({
          jlpt_level: 'N5' as const,
          kanji: item.kanji,
          kana: item.kana,
          furigana: item.furigana,
          theme: stageItem.theme,
          stage_number: stageItem.stage,
          english: item.english,
          pos: item.pos,
          metadata: item.metadata,
          examples: item.examples,
        }));
        const uniqueRecords = [...new Map(
          records.map((record) => [`${record.jlpt_level}:${record.kanji}:${record.kana}`, record]),
        ).values()];
        const duplicateCount = records.length - uniqueRecords.length;
        if (duplicateCount > 0) {
          console.warn(`Stage ${stageItem.stage}: removed ${duplicateCount} duplicate word${duplicateCount === 1 ? '' : 's'} before upsert.`);
        }

        const { error } = await supabase
          .from('vocab_items')
          .upsert(uniqueRecords, { onConflict: 'jlpt_level,kanji,kana' });

        if (error) throw error;
        totalUpserted += uniqueRecords.length;
        console.log(`Stage ${stageItem.stage}: upserted ${uniqueRecords.length} words.`);
      } catch (error: unknown) {
        failedStages += 1;
        console.error(`Stage ${stageItem.stage} failed: ${formatSeedError(error)}`);
      }

      if (stageIndex < selectedStages.length - 1) await sleep(GEMINI_REQUEST_DELAY_MS);
    }

    console.log(`N5 vocabulary seed complete. Upserted ${totalUpserted} words across ${selectedStages.length - failedStages} stages.`);
    if (failedStages > 0) process.exitCode = 1;
  }

  seedN5Curriculum().catch((error: unknown) => {
    console.error(`Vocabulary seeding failed: ${formatSeedError(error)}`);
    process.exitCode = 1;
  });
}