import api from './api'

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password })
    return response.data
  },

  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData)
    return response.data
  },

  verifyToken: async () => {
    const response = await api.get('/api/auth/verify')
    return response.data
  },

  refreshToken: async () => {
    const response = await api.post('/api/auth/refresh')
    return response.data
  }
}
