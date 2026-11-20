const { randomUUID } = require('node:crypto');
const { mkdir, rename, rm, writeFile } = require('node:fs/promises');
const { extname, join } = require('node:path');
const {
  MAX_PRODUCT_VIDEO_BYTES,
  PRODUCT_VIDEO_PREFIX,
} = require('../src/data/product-media.js');

const maxMultipartBytes = MAX_PRODUCT_VIDEO_BYTES + 64 * 1024;
const managedNamePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:mp4|webm)$/;
const videoExtensions = new Map([
  ['video/mp4', 'mp4'],
  ['video/webm', 'webm'],
]);

function uploadError(status, message) {
  return Object.assign(new Error(message), { status });
}

function videoTooLarge() {
  return uploadError(413, 'ไฟล์วิดีโอต้องมีขนาดไม่เกิน 50 MB');
}

function limitedUploadStream(req) {
  const chunks = req.iterator({ destroyOnReturn: false });
  let receivedBytes = 0;

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await chunks.next();
      if (done) {
        controller.close();
        return;
      }

      receivedBytes += value.byteLength;
      if (receivedBytes > maxMultipartBytes) {
        controller.error(videoTooLarge());
        await chunks.return();
        req.resume();
        return;
      }

      controller.enqueue(value);
    },
  });
}

function getVideoExtension(file) {
  if (file.type && file.type !== 'application/octet-stream') {
    return videoExtensions.get(file.type);
  }
  const extension = extname(file.name).toLowerCase().slice(1);
  if (extension === 'mp4' || extension === 'webm') return extension;
}

function matchesVideoHeader(bytes, extension) {
  if (extension === 'mp4') {
    return bytes.length >= 16 && bytes.toString('ascii', 4, 8) === 'ftyp';
  }
  return (
    bytes.length >= 8 &&
    bytes.readUInt32BE(0) === 0x1a45dfa3 &&
    bytes.subarray(4, 4096).includes('webm')
  );
}

async function readProductVideoRequest(req) {
  if (Number(req.get('content-length')) > maxMultipartBytes) {
    req.resume();
    throw videoTooLarge();
  }

  let form;
  try {
    form = await new Response(limitedUploadStream(req), {
      headers: { 'Content-Type': req.get('content-type') },
    }).formData();
  } catch (error) {
    if (error.status === 413) throw error;
    throw uploadError(400, 'อ่านไฟล์วิดีโอไม่ได้ กรุณาเลือกไฟล์แล้วลองอีกครั้ง');
  }

  const product = form.get('product');
  const file = form.get('video');
  if (
    typeof product !== 'string' ||
    !(file instanceof File) ||
    [...form].length !== 2
  ) {
    throw uploadError(400, 'กรุณาส่งข้อมูลประกาศพร้อมไฟล์วิดีโอหนึ่งไฟล์');
  }

  let body;
  try {
    body = JSON.parse(product);
  } catch {
    throw uploadError(400, 'ข้อมูลประกาศไม่ถูกต้อง');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw uploadError(400, 'ข้อมูลประกาศไม่ถูกต้อง');
  }

  if (file.size > MAX_PRODUCT_VIDEO_BYTES) throw videoTooLarge();
  const extension = getVideoExtension(file);
  const bytes = extension && Buffer.from(await file.arrayBuffer());
  if (!bytes || !matchesVideoHeader(bytes, extension)) {
    throw uploadError(400, 'กรุณาเลือกไฟล์วิดีโอ MP4 หรือ WebM ที่เปิดได้');
  }

  return { body, video: { bytes, extension } };
}

function getManagedVideoName(value) {
  if (typeof value !== 'string' || !value.startsWith(PRODUCT_VIDEO_PREFIX)) {
    return null;
  }
  const filename = value.slice(PRODUCT_VIDEO_PREFIX.length);
  return managedNamePattern.test(filename) ? filename : null;
}

async function storeProductVideo(directory, { bytes, extension }) {
  await mkdir(directory, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  const target = join(directory, filename);
  const temporary = `${target}.tmp`;
  try {
    await writeFile(temporary, bytes, { flag: 'wx' });
    await rename(temporary, target);
  } catch (error) {
    if (error.code !== 'EEXIST') {
      await rm(temporary, { force: true }).catch((cleanupError) => {
        console.warn('ลบไฟล์วิดีโอชั่วคราวไม่สำเร็จ', cleanupError.message);
      });
    }
    throw error;
  }
  return `${PRODUCT_VIDEO_PREFIX}${filename}`;
}

async function removeProductVideo(directory, url) {
  const filename = getManagedVideoName(url);
  if (filename) await rm(join(directory, filename), { force: true });
}

module.exports = {
  getManagedVideoName,
  readProductVideoRequest,
  removeProductVideo,
  storeProductVideo,
};
