import { io } from 'socket.io-client'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000'

class WebSocketService {
  constructor() {
    this.socket = null
    this.listeners = new Map()
  }

  connect() {
    const token = localStorage.getItem('token')
    
    this.socket = io(WS_URL, {
      auth: {
        token
      }
    })

    this.socket.on('connect', () => {
      console.log('WebSocket conectado')
    })

    this.socket.on('disconnect', () => {
      console.log('WebSocket desconectado')
    })

    this.socket.on('error', (error) => {
      console.error('Error en WebSocket:', error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data)
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback)
      
      // Guardar referencia para poder eliminar luego
      if (!this.listeners.has(event)) {
        this.listeners.set(event, [])
      }
      this.listeners.get(event).push(callback)
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback)
      
      // Remover de listeners
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event)
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  // Métodos específicos para colaboración
  joinDocument(documentId) {
    this.emit('join-document', { documentId })
  }

  leaveDocument(documentId) {
    this.emit('leave-document', { documentId })
  }

  sendDocumentUpdate(documentId, update) {
    this.emit('document-update', { documentId, update })
  }

  onDocumentUpdate(callback) {
    this.on('document-update', callback)
  }

  onUserJoined(callback) {
    this.on('user-joined', callback)
  }

  onUserLeft(callback) {
    this.on('user-left', callback)
  }
}

export const wsService = new WebSocketService()
