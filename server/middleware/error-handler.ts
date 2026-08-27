import type { ErrorRequestHandler, RequestHandler } from 'express';

export const notFoundHandler: RequestHandler = (_req, res): void => {
  res.status(404).json({ error: 'Not Found' });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, next): void => {
  console.error('Unhandled server error:', error);

  if (res.headersSent) {
    next(error);
    return;
  }

  res.status(500).json({ error: 'Internal Server Error' });
};
