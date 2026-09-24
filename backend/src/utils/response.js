export const ok = (res, data, meta, statusCode = 200) => {
  const body = { success: true, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(statusCode).json(body);
};

export const created = (res, data) => ok(res, data, undefined, 201);

export const err = (res, statusCode, code, message, extra = {}) =>
  res.status(statusCode).json({ success: false, error: { code, message, ...extra } });
