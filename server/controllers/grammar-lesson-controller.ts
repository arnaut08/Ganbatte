import { z } from 'zod';
import { GENKI_GRAMMAR_LESSONS } from '../services/genki-grammar-service.js';
import {
  getPersistedGenkiLesson,
  getPersistedGenkiLessons,
} from '../repositories/genki-lesson-repository.js';
import type { Request, Response } from 'express';
import type { GenkiLesson } from '../repositories/genki-lesson-repository.js';

const lessonNumberSchema = z.coerce.number().int().min(1).max(GENKI_GRAMMAR_LESSONS.length);

function toLessonResponse(record: GenkiLesson): { lessonNumber: number; content: unknown; contentVersion: string | null; generatedAt: string | null } {
  return {
    lessonNumber: record.lesson_number,
    content: record.content,
    contentVersion: record.content_version,
    generatedAt: record.generated_at,
  };
}

export async function listGrammarLessons(_req: Request, res: Response): Promise<void> {
  try {
    const records = await getPersistedGenkiLessons();
    res.json(records.map(toLessonResponse));
  } catch (error) {
    console.error('Grammar lesson lookup failed:', error);
    res.status(503).json({ error: 'Grammar lessons are not available.' });
  }
}

export async function getGrammarLesson(req: Request<{ lessonNumber: string }>, res: Response): Promise<void> {
  const parsed = lessonNumberSchema.safeParse(req.params.lessonNumber);
  if (!parsed.success) {
    res.status(400).json({ error: 'Lesson number must be an integer from 1 through 12.' });
    return;
  }

  try {
    const record = await getPersistedGenkiLesson(parsed.data);
    if (!record) {
      res.status(404).json({ error: 'Grammar lesson not found.' });
      return;
    }

    res.json(toLessonResponse(record));
  } catch (error) {
    console.error('Grammar lesson lookup failed:', error);
    res.status(503).json({ error: 'Grammar lesson is not available.' });
  }
}
