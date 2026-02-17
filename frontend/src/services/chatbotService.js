import api from './api'

export const chatbotService = {
  sendMessage: async (message, context = {}) => {
    const response = await api.post('/api/chatbot/message', {
      message,
      context
    })
    return response.data
  },

  getConversationHistory: async (conversationId) => {
    const response = await api.get(`/api/chatbot/conversations/${conversationId}`)
    return response.data
  },

  createConversation: async () => {
    const response = await api.post('/api/chatbot/conversations')
    return response.data
  },

  summarizeNote: async (noteId) => {
    const response = await api.post('/api/chatbot/summarize', { noteId })
    return response.data
  },

  getRecommendations: async (type, context) => {
    const response = await api.post('/api/chatbot/recommendations', { type, context })
    return response.data
  }
}
