export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Not Found' });
}

export function errorHandler(error, req, res, next) {
  console.error('Unhandled server error:', error);

  if (res.headersSent) {
    next(error);
    return;
  }

  res.status(500).json({ error: 'Internal Server Error' });
}
