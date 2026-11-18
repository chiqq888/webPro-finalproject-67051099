export const CURRENT_USER_ID = 1;

export const CATEGORIES = {
  books: 'หนังสือเรียน',
  computers: 'อุปกรณ์คอมพิวเตอร์',
  electronics: 'เครื่องใช้ไฟฟ้า',
  household: 'ของใช้ทั่วไป',
  other: 'อื่น ๆ',
};

export const CONDITIONS = {
  like_new: 'เหมือนใหม่',
  good: 'ใช้งานได้ดี',
  fair: 'มีร่องรอยการใช้งาน',
};

export const PRODUCT_STATUSES = {
  available: 'พร้อมขาย',
  reserved: 'จองแล้ว',
  sold: 'ขายแล้ว',
};

export const REPORT_STATUSES = {
  pending: 'รอตรวจสอบ',
  reviewed: 'ตรวจสอบแล้ว',
};

export const REPORT_REASONS = {
  scam: 'สงสัยหลอกลวง',
  prohibited: 'สินค้าต้องห้าม',
  inappropriate: 'เนื้อหาไม่เหมาะสม',
  other: 'อื่น ๆ',
};

const priceFormatter = new Intl.NumberFormat('th-TH', {
  maximumFractionDigits: 2,
});

export function formatPrice(price) {
  return `฿${priceFormatter.format(price)}`;
}
