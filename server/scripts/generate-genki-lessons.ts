import { GENKI_GRAMMAR_LESSONS } from '../services/genki-grammar-service.js';
import {
  GENKI_LESSON_CONTENT_VERSION,
  generateGenkiLesson,
} from '../services/genki-lesson-service.js';
import {
  getPersistedGenkiLesson,
  upsertGenkiLesson,
} from '../repositories/genki-lesson-repository.js';

const args = new Set(process.argv.slice(2));
const requestedLesson = process.argv.find((value) => value.startsWith('--lesson='))?.split('=')[1]
  || (args.has('--lesson') ? process.argv[process.argv.indexOf('--lesson') + 1] : null);
const dryRun = args.has('--dry-run');
const force = args.has('--force');

function getLessonNumbers(): number[] {
  if (!requestedLesson) return GENKI_GRAMMAR_LESSONS.map((lesson) => lesson.number);
  const lessonNumber = Number(requestedLesson);
  if (!Number.isInteger(lessonNumber) || lessonNumber < 1 || lessonNumber > GENKI_GRAMMAR_LESSONS.length) {
    throw new Error('--lesson must be an integer from 1 through 12');
  }
  return [lessonNumber];
}

async function main(): Promise<void> {
  const lessonNumbers = getLessonNumbers();
  let generated = 0;
  let skipped = 0;

  for (const lessonNumber of lessonNumbers) {
    const existing = dryRun || force ? null : await getPersistedGenkiLesson(lessonNumber);
    if (existing) {
      skipped += 1;
      console.log(`Lesson ${lessonNumber}: skipped (already persisted)`);
      continue;
    }

    console.log(`Lesson ${lessonNumber}: generating`);
    const result = await generateGenkiLesson(lessonNumber);

    if (dryRun) {
      generated += 1;
      console.log(JSON.stringify(result.content, null, 2));
      continue;
    }

    await upsertGenkiLesson({
      lessonNumber,
      content: result.content,
      contentVersion: String(GENKI_LESSON_CONTENT_VERSION),
      model: result.model,
    });
    generated += 1;
    console.log(`Lesson ${lessonNumber}: persisted`);
  }

  console.log(`Completed: ${generated} generated, ${skipped} skipped`);
}

main().catch((error: unknown) => {
  console.error(`Generation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
