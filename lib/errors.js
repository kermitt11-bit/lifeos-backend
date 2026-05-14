export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function errorMiddleware(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  const supaCode = err?.code;
  if (typeof supaCode === 'string' && supaCode.length === 5) {
    const status = supaCode === '23505' ? 409 : 400;
    return res.status(status).json({ error: err.message, code: supaCode });
  }
  console.error('[lifeos] unhandled error:', err);
  res.status(500).json({ error: 'internal_server_error' });
}
