import { z } from 'zod';
import { generateGrammarAssessment } from '../services/genki-grammar-service.js';

const assessmentQuerySchema = z.object({
  maxLesson: z.coerce.number().int().min(1).max(12).default(1),
  count: z.coerce.number().int().min(1).max(25).default(10),
  type: z.enum(['grammar', 'kana', 'kanji']).default('grammar'),
});

export async function generateAssessment(req, res) {
  const parsed = assessmentQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid assessment request parameters' });
    return;
  }

  const { maxLesson, count, type } = parsed.data;

  if (type !== 'grammar') {
    res.status(400).json({ error: 'Only grammar assessment generation is currently supported' });
    return;
  }

  try {
    const questions = await generateGrammarAssessment({ maxLesson, count });
    res.json({
      type,
      maxLesson,
      count: questions.length,
      questions,
    });
  } catch (error) {
    console.error('Assessment generation failed:', error);
    res.status(500).json({ error: 'Assessment generation failed' });
  }
}
