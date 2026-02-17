import api from './api'

export const userService = {
  getProfile: async (userId) => {
    const response = await api.get(`/api/users/${userId}`)
    return response.data
  },

  updateProfile: async (userId, data) => {
    const response = await api.put(`/api/users/${userId}`, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  },

  getCourses: async (userId) => {
    const response = await api.get(`/api/users/${userId}/courses`)
    return response.data
  },

  enrollCourse: async (courseId) => {
    const response = await api.post(`/api/users/courses/${courseId}/enroll`)
    return response.data
  },

  getReputation: async (userId) => {
    const response = await api.get(`/api/users/${userId}/reputation`)
    return response.data
  },

  getActivityFeed: async (userId) => {
    const response = await api.get(`/api/users/${userId}/activity`)
    return response.data
  }
}
