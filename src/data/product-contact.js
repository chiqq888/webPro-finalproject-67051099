export function validateProductContact({ lineId, instagram, phone }) {
  if (!lineId && !instagram && !phone) {
    return { contact: 'กรอกช่องทางติดต่ออย่างน้อยหนึ่งช่องทาง' };
  }

  const errors = {};
  if (lineId && !/^[a-z0-9._@-]{1,40}$/i.test(lineId)) {
    errors.lineId = 'กรอก LINE ID โดยใช้ตัวอักษรอังกฤษ ตัวเลข จุด _ @ หรือ -';
  }
  if (instagram && !/^@?[a-z0-9._]{1,30}$/i.test(instagram)) {
    errors.instagram = 'กรอกชื่อผู้ใช้ Instagram เช่น campus_student';
  }
  if (
    phone &&
    (phone.length > 40 ||
      !/^\+?[0-9 ().-]+$/.test(phone) ||
      !/^\d{8,15}$/.test(phone.replace(/\D/g, '')))
  ) {
    errors.phone = 'กรอกเบอร์โทรที่มีตัวเลข 8–15 หลัก';
  }
  return errors;
}
