import { HttpError } from './errors.js';

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj?.[k] !== undefined) out[k] = obj[k];
  return out;
}

export function requireFields(body, fields) {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'body_required');
  for (const f of fields) {
    if (body[f] === undefined || body[f] === null || body[f] === '') {
      throw new HttpError(400, `missing_field: ${f}`);
    }
  }
}

export function pickFields(body, fields) {
  return pick(body || {}, fields);
}
