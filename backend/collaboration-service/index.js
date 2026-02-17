import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { verifyToken } from '../shared/auth.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

const PORT = process.env.PORT || 4004

app.use(cors())
app.use(express.json())

// Almacenar usuarios activos por documento
const activeUsers = new Map() // documentId -> Set of userIds

// Middleware de autenticación para Socket.IO
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error('Authentication error'))
    }

    const decoded = verifyToken(token)
    socket.userId = decoded.id
    socket.userName = decoded.name
    next()
  } catch (error) {
    next(new Error('Authentication error'))
  }
})

io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.userName} (${socket.userId})`)

  // Unirse a un documento
  socket.on('join-document', ({ documentId }) => {
    socket.join(documentId)
    
    if (!activeUsers.has(documentId)) {
      activeUsers.set(documentId, new Set())
    }
    activeUsers.get(documentId).add(socket.userId)

    // Notificar a otros usuarios
    socket.to(documentId).emit('user-joined', {
      id: socket.userId,
      name: socket.userName
    })

    // Enviar lista de usuarios activos al usuario que se une
    const users = Array.from(activeUsers.get(documentId))
    socket.emit('active-users', users)

    console.log(`Usuario ${socket.userName} se unió al documento ${documentId}`)
  })

  // Salir de un documento
  socket.on('leave-document', ({ documentId }) => {
    socket.leave(documentId)
    
    if (activeUsers.has(documentId)) {
      activeUsers.get(documentId).delete(socket.userId)
      
      if (activeUsers.get(documentId).size === 0) {
        activeUsers.delete(documentId)
      }
    }

    // Notificar a otros usuarios
    socket.to(documentId).emit('user-left', {
      id: socket.userId,
      name: socket.userName
    })

    console.log(`Usuario ${socket.userName} salió del documento ${documentId}`)
  })

  // Actualización de documento
  socket.on('document-update', ({ documentId, update }) => {
    // Broadcast a todos excepto al emisor
    socket.to(documentId).emit('document-update', {
      userId: socket.userId,
      userName: socket.userName,
      content: update.content,
      timestamp: Date.now()
    })
  })

  // Cursor position (para mostrar dónde están editando otros usuarios)
  socket.on('cursor-position', ({ documentId, position }) => {
    socket.to(documentId).emit('cursor-position', {
      userId: socket.userId,
      userName: socket.userName,
      position
    })
  })

  // Desconexión
  socket.on('disconnect', () => {
    console.log(`Usuario desconectado: ${socket.userName}`)
    
    // Remover de todos los documentos
    activeUsers.forEach((users, documentId) => {
      if (users.has(socket.userId)) {
        users.delete(socket.userId)
        io.to(documentId).emit('user-left', {
          id: socket.userId,
          name: socket.userName
        })
      }
    })
  })
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'collaboration-service',
    activeDocuments: activeUsers.size
  })
})

httpServer.listen(PORT, () => {
  console.log(`Collaboration Service ejecutándose en puerto ${PORT}`)
})
