import { z } from 'zod';
import { GENKI_GRAMMAR_LESSONS } from '../services/genki-grammar-service.js';
import {
  getPersistedGenkiLesson,
  getPersistedGenkiLessons,
} from '../repositories/genki-lesson-repository.js';

const lessonNumberSchema = z.coerce.number().int().min(1).max(GENKI_GRAMMAR_LESSONS.length);

function toLessonResponse(record) {
  return {
    lessonNumber: record.lesson_number,
    content: record.content,
    contentVersion: record.content_version,
    generatedAt: record.generated_at,
  };
}

export async function listGrammarLessons(req, res) {
  try {
    const records = await getPersistedGenkiLessons();
    res.json(records.map(toLessonResponse));
  } catch (error) {
    console.error('Grammar lesson lookup failed:', error);
    res.status(503).json({ error: 'Grammar lessons are not available.' });
  }
}

export async function getGrammarLesson(req, res) {
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