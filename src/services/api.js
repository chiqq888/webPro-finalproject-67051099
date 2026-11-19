const API_BASE_URL = '/api';
const CONNECTION_ERROR = 'เชื่อมต่อ JSON Server ไม่ได้ กรุณาเปิดเซิร์ฟเวอร์แล้วลองอีกครั้ง';
export const SESSION_EXPIRED = 'campus-market:session-expired';

async function request(path, { method = 'GET', data, signal } = {}) {
  const options = { method, signal, credentials: 'same-origin' };

  if (data !== undefined) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(data);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error(CONNECTION_ERROR);
  }

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/')) {
      window.dispatchEvent(new Event(SESSION_EXPIRED));
    }

    const body = await response.json().catch(() => null);
    let message = body?.message;
    if (!message && response.status >= 500) message = CONNECTION_ERROR;
    if (!message) {
      message = `เซิร์ฟเวอร์ทำรายการไม่สำเร็จ (HTTP ${response.status}) กรุณาลองอีกครั้ง`;
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (method === 'DELETE' || response.status === 204) return;
  return response.json();
}

export function getSession(signal) {
  return request('/auth/me', { signal });
}

export function login(data) {
  return request('/auth/login', { method: 'POST', data });
}

export function logout() {
  return request('/auth/logout', { method: 'POST', data: {} });
}

export function getUsers(signal) {
  return request('/users', { signal });
}

export function getProducts(signal) {
  return request('/products', { signal });
}

export function getProduct(id, signal) {
  return request(`/products/${Number(id)}`, { signal });
}

export function getMyProducts(signal) {
  return request('/my/products', { signal });
}

export function getMyProduct(id, signal) {
  return request(`/my/products/${Number(id)}`, { signal });
}

export function getAdminProducts(signal) {
  return request('/admin/products', { signal });
}

export function createProduct(data) {
  return request('/products', { method: 'POST', data });
}

export function updateProduct(id, data) {
  return request(`/products/${id}`, { method: 'PATCH', data });
}

export function deleteProduct(id) {
  return request(`/products/${id}`, { method: 'DELETE' });
}

export function getReports(signal) {
  return request('/reports', { signal });
}

export function getMyReports(signal) {
  return request('/my/reports', { signal });
}

export function createReport(data) {
  return request('/reports', { method: 'POST', data });
}

export function updateReport(id, data) {
  return request(`/reports/${id}`, { method: 'PATCH', data });
}
