module.exports = function assignProductId(req, res, next) {
  const isProductPost =
    req.method === 'POST' && /^\/products\/?$/i.test(req.path) && req.body;
  const isProductDelete =
    req.method === 'DELETE' && /^\/products\/[^/]+\/?$/i.test(req.path);

  if (!isProductPost && !isProductDelete) return next();

  const state = req.app.db.getState();
  const { meta, products, reports } = state;
  let highestId = meta?.lastProductId ?? 0;

  for (const product of products) {
    highestId = Math.max(highestId, product.id);
  }

  // กันการใช้ ID ซ้ำกับประกาศที่ถูกลบแต่ยังมีประวัติรายงาน
  for (const report of reports) {
    highestId = Math.max(highestId, report.productId);
  }

  if (isProductPost) {
    highestId += 1;
    req.body.id = highestId;
  }

  // เก็บค่าสูงสุดก่อนลบด้วย เผื่อฐานข้อมูลเก่ายังไม่มีตัวนับ
  // JSON Server จะบันทึกตัวนับพร้อมกับการเพิ่มหรือลบประกาศ
  state.meta ??= {};
  state.meta.lastProductId = highestId;

  next();
};
