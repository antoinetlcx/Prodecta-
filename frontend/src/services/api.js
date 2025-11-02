import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Instance Axios avec config de base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('oulia_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('oulia_token')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  }
)

// ===== AUTH =====
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
}

// ===== PROPERTIES =====
export const propertyAPI = {
  create: (data) => api.post('/properties', data),
  getAll: () => api.get('/properties'),
  getById: (id) => api.get(`/properties/${id}`),
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
  getPublic: (propertyId) => api.get(`/properties/public/${propertyId}`),
}

// ===== CHAT =====
export const chatAPI = {
  createConversation: (propertyId, data) => api.post(`/chat/conversations/${propertyId}`, data),
  sendMessage: (conversationId, data) => api.post(`/chat/conversations/${conversationId}/messages`, data),
  getConversation: (conversationId) => api.get(`/chat/conversations/${conversationId}`),
  translate: (text, targetLanguage) => api.post('/chat/translate', { text, targetLanguage }),
  reportIssue: (propertyId, data) => api.post(`/chat/issues/${propertyId}`, data),
}

export default api
