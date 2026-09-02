import type { Request, Response } from 'express';
import { deleteAccount as removeAccount } from '../services/account-service.js';

export async function deleteAccount(req: Request, res: Response): Promise<void> {
  try {
    await removeAccount(req.user!.id);
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete account:', error);
    res.status(500).json({ error: 'Unable to delete account.' });
  }
}