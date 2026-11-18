const API_BASE_URL = 'http://localhost:3001'

async function request(path, { method = 'GET', data, signal } = {}) {
  const options = { method, signal }

  if (data !== undefined) {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(data)
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options)
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('เชื่อมต่อ JSON Server ไม่ได้ กรุณาเปิดเซิร์ฟเวอร์แล้วลองอีกครั้ง')
  }

  if (!response.ok) {
    const message = response.status === 404
      ? 'ไม่พบข้อมูลที่ต้องการ'
      : `เซิร์ฟเวอร์ทำรายการไม่สำเร็จ (HTTP ${response.status}) กรุณาลองอีกครั้ง`
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  if (method === 'DELETE') return
  return response.json()
}

export function getUsers(signal) {
  return request('/users', { signal })
}

export function getProducts(signal) {
  return request('/products', { signal })
}

export function getProduct(id, signal) {
  return request(`/products/${Number(id)}`, { signal })
}

export function createProduct(data) {
  return request('/products', { method: 'POST', data })
}

export function updateProduct(id, data) {
  return request(`/products/${id}`, { method: 'PATCH', data })
}

export function deleteProduct(id) {
  return request(`/products/${id}`, { method: 'DELETE' })
}

export function getReports(signal) {
  return request('/reports', { signal })
}

export function createReport(data) {
  return request('/reports', { method: 'POST', data })
}

export function updateReport(id, data) {
  return request(`/reports/${id}`, { method: 'PATCH', data })
}
