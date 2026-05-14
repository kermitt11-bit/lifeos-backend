import crypto from 'node:crypto';
import { env } from './env.js';
import { userClient } from './supabase.js';
import { HttpError } from './errors.js';

function b64urlDecode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

function verifyJwtHS256(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new HttpError(401, 'invalid_token');
  const [h, p, s] = parts;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${h}.${p}`)
    .digest();
  const got = b64urlDecode(s);
  if (expected.length !== got.length || !crypto.timingSafeEqual(expected, got)) {
    throw new HttpError(401, 'invalid_signature');
  }
  const payload = JSON.parse(b64urlDecode(p).toString('utf8'));
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    throw new HttpError(401, 'token_expired');
  }
  return payload;
}

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const m = /^Bearer (.+)$/.exec(header);
  if (!m) return next(new HttpError(401, 'missing_authorization'));
  const token = m[1];
  try {
    let payload;
    if (env.supabaseJwtSecret) {
      payload = verifyJwtHS256(token, env.supabaseJwtSecret);
    } else {
      const parts = token.split('.');
      if (parts.length !== 3) throw new HttpError(401, 'invalid_token');
      payload = JSON.parse(b64urlDecode(parts[1]).toString('utf8'));
    }
    if (!payload.sub) throw new HttpError(401, 'token_missing_subject');
    req.user = { id: payload.sub, email: payload.email };
    req.accessToken = token;
    req.db = userClient(token);
    next();
  } catch (e) {
    next(e instanceof HttpError ? e : new HttpError(401, 'invalid_token'));
  }
}

export function requireCron(req, _res, next) {
  const provided = req.headers['x-cron-secret'] || req.query.secret;
  if (!env.cronSecret || provided !== env.cronSecret) {
    return next(new HttpError(401, 'invalid_cron_secret'));
  }
  next();
}
