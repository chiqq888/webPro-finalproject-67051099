module.exports = function assignProductId(req, res, next) {
  if (req.method === 'POST' && req.path === '/products' && req.body && req.body.id == null) {
    const { products, reports } = req.app.db.getState()
    let highestId = 0

    for (const product of products) {
      highestId = Math.max(highestId, product.id)
    }

    // กันการใช้ ID ซ้ำกับประกาศที่ถูกลบแต่ยังมีประวัติรายงาน
    for (const report of reports) {
      highestId = Math.max(highestId, report.productId)
    }

    req.body.id = highestId + 1
  }

  next()
}
