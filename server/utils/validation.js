import { z } from 'zod';

export const roomCodeSchema = z.string()
  .trim()
  .regex(/^[A-Z0-9]{6}$/)
  .transform((value) => value.toUpperCase());

export const usernameSchema = z.string().trim().min(1).max(40);
export const sessionKeySchema = z.string().trim().min(16).max(100);
export const answerSchema = z.string().trim().min(1).max(500);
export const cardCountSchema = z.coerce.number().int().min(1).max(25).default(10);

export const cardSchema = z.object({
  kana: z.string().min(1).max(500),
  romaji: z.string().min(1).max(500),
  english: z.string().max(500).optional(),
}).strict();

export const cardsSchema = z.array(cardSchema).min(1).max(25);
