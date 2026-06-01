// adminApi.js — Axios instance for admin dashboard
import axios from 'axios'

// Ensure the base URL always includes /v1 path prefix
let baseURL = import.meta.env.VITE_API_BASE_URL || 'https://haiq-api-9im4.onrender.com/v1'
// If base URL doesn't end with /v1, append it
if (baseURL && !baseURL.endsWith('/v1')) {
  baseURL = baseURL.replace(/\/$/, '') + '/v1'
}

const adminApi = axios.create({
  baseURL,
  withCredentials: false,
})

// Attach admin JWT from localStorage on every request
adminApi.interceptors.request.use(config => {
  const token = localStorage.getItem('haiq_admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear token and redirect to login
adminApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('haiq_admin_token')
      localStorage.removeItem('haiq_admin_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default adminApi
