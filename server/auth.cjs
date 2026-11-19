const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const {
  CATEGORIES,
  CONDITIONS,
  PRODUCT_STATUSES,
  REPORT_REASONS,
} = require('../src/data/constants.js');
const { accounts, unknownAccount } = require('./demo-accounts.cjs');

const derivePassword = promisify(scrypt);
const cookieName = 'campus_session';
const sessionLifetime = 8 * 60 * 60 * 1000;
const loginWindow = 60 * 1000;
const loginLimit = 12;
const sessions = new Map();
const loginAttempts = new Map();

function sendError(res, status, message) {
  return res.status(status).json({ message });
}

function sessionToken(req) {
  const cookie = req.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)campus_session=([a-f0-9]{64})(?:;|$)/);
  return match?.[1];
}

function sessionUser(req, users) {
  const token = sessionToken(req);
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return users.find((user) => user.id === session.userId);
}

function identity(user) {
  return { id: user.id, displayName: user.displayName, role: user.role };
}

function cookieOptions(req) {
  return { httpOnly: true, sameSite: 'strict', secure: req.secure, path: '/' };
}

function clearExpired(entries, now) {
  for (const [key, entry] of entries) {
    if (entry.expiresAt <= now) entries.delete(key);
  }
}

async function handleLogin(req, res, users) {
  const { username, password } = req.body;
  if (
    typeof username !== 'string' ||
    !username.trim() ||
    username.length > 50 ||
    typeof password !== 'string' ||
    !password ||
    password.length > 256
  ) {
    return sendError(res, 400, 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
  }

  const now = Date.now();
  const key = req.ip;
  clearExpired(loginAttempts, now);
  const attempts = loginAttempts.get(key) || {
    count: 0,
    expiresAt: now + loginWindow,
  };
  if (attempts.count >= loginLimit) {
    res.set(
      'Retry-After',
      String(Math.ceil((attempts.expiresAt - now) / 1000)),
    );
    return sendError(res, 429, 'ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่');
  }
  attempts.count += 1;
  loginAttempts.set(key, attempts);

  const account = accounts.get(username.trim().toLowerCase());
  // ใช้ scrypt และการเปรียบเทียบแบบเดียวกันแม้ไม่พบชื่อผู้ใช้
  const { salt, hash } = account || unknownAccount;
  const actualHash = await derivePassword(password, salt, hash.length);
  const passwordMatches = timingSafeEqual(actualHash, hash);
  const user = account && users.find((profile) => profile.id === account.id);
  if (!passwordMatches || !user) {
    return sendError(res, 401, 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  }

  clearExpired(sessions, now);
  sessions.delete(sessionToken(req));
  const token = randomBytes(32).toString('hex');
  sessions.set(token, { userId: user.id, expiresAt: now + sessionLifetime });
  return res
    .cookie(cookieName, token, {
      ...cookieOptions(req),
      maxAge: sessionLifetime,
    })
    .json(identity(user));
}

function acceptsOrigin(req) {
  const origin = req.get('origin');
  if (origin !== undefined) {
    return origin === `${req.protocol}://${req.get('host')}`;
  }
  const fetchSite = req.get('sec-fetch-site');
  return !fetchSite || fetchSite === 'same-origin';
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isPositiveId(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function hasOnlyFields(body, fields) {
  return Object.keys(body).every((key) => fields.includes(key));
}

function textWithin(value, minimum, maximum) {
  return (
    typeof value === 'string' &&
    value.length >= minimum &&
    value.length <= maximum
  );
}

function validImageUrl(value) {
  if (typeof value !== 'string') return false;
  if (value.startsWith('/')) {
    return value.length > 1 && !value.startsWith('//') && !value.includes('\\');
  }
  if (!/^https?:\/\//i.test(value)) return false;
  try {
    return Boolean(new URL(value).hostname);
  } catch {
    return false;
  }
}

const productFields = {
  title: (value) => textWithin(value, 3, 100),
  description: (value) => textWithin(value, 10, 2000),
  pickupLocation: (value) => textWithin(value, 2, 120),
  category: (value) =>
    typeof value === 'string' && Object.hasOwn(CATEGORIES, value),
  condition: (value) =>
    typeof value === 'string' && Object.hasOwn(CONDITIONS, value),
  imageUrl: validImageUrl,
  price: (value) =>
    Number.isFinite(value) &&
    value > 0 &&
    (Number.isInteger(value) || /^\d+\.\d{1,2}$/.test(String(value))),
};

function readProductFields(body, required = false) {
  const fields = {};
  for (const [key, validate] of Object.entries(productFields)) {
    if (!required && !Object.hasOwn(body, key)) continue;
    const input = body[key];
    const value = typeof input === 'string' ? input.trim() : input;
    if (!validate(value)) return null;
    fields[key] = value;
  }
  return fields;
}

function handleRead(req, res, state, resource, id) {
  const { path } = req;
  const { products, reports, users } = state;
  if (path === '/products') {
    return res.json(products.filter((product) => !product.isHidden));
  }
  if (resource === 'products') {
    const product = products.find((item) => item.id === id && !item.isHidden);
    if (!product) return sendError(res, 404, 'ไม่พบประกาศ');
    return res.json(product);
  }
  if (path === '/users') {
    return res.json(
      users.map(({ id, displayName, lineId, instagram, phone }) => ({
        id,
        displayName,
        lineId,
        instagram,
        phone,
      })),
    );
  }

  const privatePaths = [
    '/auth/me',
    '/my/products',
    '/my/reports',
    '/admin/products',
    '/reports',
  ];
  if (!privatePaths.includes(path) && resource !== 'my/products') {
    return sendError(res, 404, 'ไม่พบเส้นทาง API');
  }

  const user = sessionUser(req, users);
  if (!user) return sendError(res, 401, 'กรุณาเข้าสู่ระบบ');
  if (path === '/auth/me') return res.json(identity(user));
  if (path === '/my/products') {
    return res.json(products.filter((product) => product.sellerId === user.id));
  }
  if (resource === 'my/products') {
    const product = products.find((item) => item.id === id);
    if (!product || (product.isHidden && product.sellerId !== user.id)) {
      return sendError(res, 404, 'ไม่พบประกาศ');
    }
    if (product.sellerId !== user.id) {
      return sendError(res, 403, 'จัดการประกาศของผู้ใช้อื่นไม่ได้');
    }
    return res.json(product);
  }
  if (path === '/my/reports') {
    return res.json(reports.filter((report) => report.reporterId === user.id));
  }
  if (user.role !== 'admin') {
    return sendError(res, 403, 'เฉพาะผู้ดูแลตลาดเท่านั้น');
  }
  return res.json(path === '/admin/products' ? products : reports);
}

function createProduct(req, res, next, user) {
  if (!hasOnlyFields(req.body, Object.keys(productFields))) {
    return sendError(res, 400, 'ส่งได้เฉพาะข้อมูลประกาศ');
  }
  const fields = readProductFields(req.body, true);
  if (!fields) return sendError(res, 400, 'ข้อมูลประกาศไม่ครบหรือไม่ถูกต้อง');

  const now = new Date().toISOString();
  req.body = {
    ...fields,
    sellerId: user.id,
    status: 'available',
    isHidden: false,
    createdAt: now,
    updatedAt: now,
  };
  return next();
}

function manageProduct(req, res, next, product, user) {
  const isVisibilityChange =
    req.method === 'PATCH' && Object.hasOwn(req.body, 'isHidden');
  if (isVisibilityChange) {
    if (user.role !== 'admin') {
      return sendError(res, 403, 'เฉพาะผู้ดูแลตลาดเท่านั้นที่ซ่อนหรือคืนประกาศได้');
    }
    if (!product) return sendError(res, 404, 'ไม่พบประกาศ');
    if (
      !hasOnlyFields(req.body, ['isHidden']) ||
      typeof req.body.isHidden !== 'boolean'
    ) {
      return sendError(res, 400, 'ส่งได้เฉพาะค่าแสดงหรือซ่อนประกาศ');
    }
    req.body = {
      isHidden: req.body.isHidden,
      updatedAt: new Date().toISOString(),
    };
    return next();
  }

  if (
    !product ||
    (product.isHidden && product.sellerId !== user.id && user.role !== 'admin')
  ) {
    return sendError(res, 404, 'ไม่พบประกาศ');
  }
  if (product.sellerId !== user.id) {
    return sendError(res, 403, 'จัดการประกาศของผู้ใช้อื่นไม่ได้');
  }
  if (req.method === 'DELETE') return next();

  if (!hasOnlyFields(req.body, [...Object.keys(productFields), 'status'])) {
    return sendError(res, 400, 'ระบุได้เฉพาะข้อมูลประกาศและสถานะการขาย');
  }
  const fields = readProductFields(req.body);
  if (!fields) return sendError(res, 400, 'ข้อมูลประกาศไม่ถูกต้อง');
  if (Object.hasOwn(req.body, 'status')) {
    const { status } = req.body;
    if (
      typeof status !== 'string' ||
      !Object.hasOwn(PRODUCT_STATUSES, status)
    ) {
      return sendError(res, 400, 'สถานะการขายไม่ถูกต้อง');
    }
    fields.status = status;
  }
  if (!Object.keys(fields).length) {
    return sendError(res, 400, 'กรุณาระบุข้อมูลที่ต้องการเปลี่ยน');
  }
  req.body = { ...fields, updatedAt: new Date().toISOString() };
  return next();
}

function createReport(req, res, next, state, user) {
  const { productId, reason, details = '' } = req.body;
  if (
    !hasOnlyFields(req.body, ['productId', 'reason', 'details']) ||
    !isPositiveId(productId) ||
    typeof reason !== 'string' ||
    !Object.hasOwn(REPORT_REASONS, reason) ||
    typeof details !== 'string' ||
    !textWithin(details.trim(), reason === 'other' ? 10 : 0, 500)
  ) {
    return sendError(res, 400, 'ข้อมูลรายงานไม่ครบหรือไม่ถูกต้อง');
  }

  const product = state.products.find((item) => item.id === productId);
  if (!product || product.isHidden) return sendError(res, 404, 'ไม่พบประกาศ');
  if (product.sellerId === user.id) {
    return sendError(res, 403, 'รายงานประกาศของตัวเองไม่ได้');
  }
  const alreadyReported = state.reports.some(
    (report) => report.productId === productId && report.reporterId === user.id,
  );
  if (alreadyReported) return sendError(res, 409, 'คุณเคยรายงานประกาศนี้แล้ว');

  req.body = {
    productId,
    productTitle: product.title,
    reporterId: user.id,
    reason,
    details: details.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    reviewedAt: null,
  };
  return next();
}

function reviewReport(req, res, next, report, user) {
  if (user.role !== 'admin') {
    return sendError(res, 403, 'เฉพาะผู้ดูแลตลาดเท่านั้น');
  }
  if (!report) return sendError(res, 404, 'ไม่พบรายงาน');
  if (!hasOnlyFields(req.body, ['status']) || req.body.status !== 'reviewed') {
    return sendError(res, 400, 'กำหนดสถานะรายงานได้เป็นตรวจสอบแล้วเท่านั้น');
  }
  if (report.status === 'reviewed') return res.json(report);
  req.body = { status: 'reviewed', reviewedAt: new Date().toISOString() };
  return next();
}

module.exports = function campusAccess(req, res, next) {
  res.set('Cache-Control', 'no-store');
  const { method, path } = req;
  if (req.originalUrl.includes('?')) {
    return sendError(res, 400, 'เส้นทาง API นี้ไม่รองรับพารามิเตอร์ใน URL');
  }

  const match = /^\/(products|my\/products|reports)\/([1-9]\d*)$/.exec(path);
  const resource = match?.[1];
  const id = Number(match?.[2]);
  if (match && !isPositiveId(id)) return sendError(res, 404, 'ไม่พบข้อมูล');

  const state = req.app.db.getState();
  if (method === 'GET') return handleRead(req, res, state, resource, id);

  const isLogin = method === 'POST' && path === '/auth/login';
  const isLogout = method === 'POST' && path === '/auth/logout';
  const isProductCreate = method === 'POST' && path === '/products';
  const isReportCreate = method === 'POST' && path === '/reports';
  const isProductChange =
    resource === 'products' && (method === 'PATCH' || method === 'DELETE');
  const isReportReview = resource === 'reports' && method === 'PATCH';
  if (
    !isLogin &&
    !isLogout &&
    !isProductCreate &&
    !isReportCreate &&
    !isProductChange &&
    !isReportReview
  ) {
    return sendError(res, 404, 'ไม่พบเส้นทาง API');
  }
  if (!acceptsOrigin(req)) return sendError(res, 403, 'คำขอนี้มาจากคนละเว็บไซต์');

  if (isLogout) {
    sessions.delete(sessionToken(req));
    return res.clearCookie(cookieName, cookieOptions(req)).status(204).end();
  }

  const user = isLogin ? null : sessionUser(req, state.users);
  if (!isLogin && !user) return sendError(res, 401, 'กรุณาเข้าสู่ระบบ');
  if (
    method !== 'DELETE' &&
    (!req.is('application/json') || !isObject(req.body))
  ) {
    return sendError(res, 400, 'กรุณาส่งข้อมูลเป็น JSON object');
  }
  if (isLogin) {
    return handleLogin(req, res, state.users).catch(() =>
      sendError(res, 500, 'เข้าสู่ระบบไม่ได้ กรุณาลองอีกครั้ง'),
    );
  }
  if (isProductCreate) return createProduct(req, res, next, user);
  if (isReportCreate) return createReport(req, res, next, state, user);
  if (isProductChange) {
    const product = state.products.find((item) => item.id === id);
    return manageProduct(req, res, next, product, user);
  }

  const report = state.reports.find((item) => item.id === id);
  return reviewReport(req, res, next, report, user);
};
