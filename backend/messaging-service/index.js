import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { query } from '../shared/database.js'
import { authMiddleware } from '../shared/auth.js'
import { sanitizeInput } from '../shared/validation.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4008

app.use(cors())
app.use(express.json())

// Obtener o crear conversación entre dos usuarios
function getOrCreateConversation(user1Id, user2Id) {
  const u1 = Math.min(user1Id, user2Id)
  const u2 = Math.max(user1Id, user2Id)
  return { user1_id: u1, user2_id: u2 }
}

// Obtener lista de conversaciones del usuario
app.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id

    const conversations = await query(
      `SELECT 
        c.id,
        c.user1_id,
        c.user2_id,
        c.updated_at,
        (SELECT content FROM dm_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM dm_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
        (SELECT COUNT(*) FROM dm_messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
      FROM dm_conversations c
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY c.updated_at DESC`,
      [userId, userId, userId]
    )

    const formatted = await Promise.all(conversations.map(async (conv) => {
      const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id
      const [otherUser] = await query(
        'SELECT id, name, nickname, avatar_url FROM users WHERE id = ?',
        [otherUserId]
      )
      return {
        id: conv.id,
        otherUser: otherUser ? {
          id: otherUser.id,
          name: otherUser.name,
          nickname: otherUser.nickname,
          avatar_url: otherUser.avatar_url
        } : null,
        lastMessage: conv.last_message,
        lastMessageAt: conv.last_message_at,
        unreadCount: conv.unread_count || 0
      }
    }))

    res.json(formatted)
  } catch (error) {
    console.error('Error al obtener conversaciones:', error)
    res.status(500).json({ message: 'Error al obtener conversaciones' })
  }
})

// Obtener mensajes de una conversación
app.get('/conversations/:conversationId/messages', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params
    const userId = req.user.id

    const [conv] = await query(
      'SELECT * FROM dm_conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
      [conversationId, userId, userId]
    )

    if (!conv) {
      return res.status(404).json({ message: 'Conversación no encontrada' })
    }

    const messages = await query(
      `SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
       FROM dm_messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`,
      [conversationId]
    )

    await query(
      'UPDATE dm_messages SET is_read = 1, read_at = NOW() WHERE conversation_id = ? AND sender_id != ?',
      [conversationId, userId]
    )

    res.json(messages.map(m => ({
      id: m.id,
      senderId: m.sender_id,
      senderName: m.sender_name,
      senderAvatar: m.sender_avatar,
      content: m.content,
      isRead: !!m.is_read,
      readAt: m.read_at,
      createdAt: m.created_at
    })))
  } catch (error) {
    console.error('Error al obtener mensajes:', error)
    res.status(500).json({ message: 'Error al obtener mensajes' })
  }
})

// Iniciar conversación o obtener existente con un usuario
app.post('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const { otherUserId } = req.body

    if (!otherUserId || otherUserId === userId) {
      return res.status(400).json({ message: 'Usuario inválido' })
    }

    const { user1_id, user2_id } = getOrCreateConversation(userId, otherUserId)

    let [existing] = await query(
      'SELECT id FROM dm_conversations WHERE user1_id = ? AND user2_id = ?',
      [user1_id, user2_id]
    )

    if (!existing) {
      const result = await query(
        'INSERT INTO dm_conversations (user1_id, user2_id) VALUES (?, ?)',
        [user1_id, user2_id]
      )
      existing = { id: result.insertId }
    }

    res.json({ conversationId: existing.id })
  } catch (error) {
    console.error('Error al crear conversación:', error)
    res.status(500).json({ message: 'Error al crear conversación' })
  }
})

// Enviar mensaje
app.post('/conversations/:conversationId/messages', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params
    const { content } = req.body
    const userId = req.user.id

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'El mensaje no puede estar vacío' })
    }

    const [conv] = await query(
      'SELECT * FROM dm_conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
      [conversationId, userId, userId]
    )

    if (!conv) {
      return res.status(404).json({ message: 'Conversación no encontrada' })
    }

    const result = await query(
      'INSERT INTO dm_messages (conversation_id, sender_id, content) VALUES (?, ?, ?)',
      [conversationId, userId, sanitizeInput(content)]
    )

    await query(
      'UPDATE dm_conversations SET updated_at = NOW() WHERE id = ?',
      [conversationId]
    )

    const [message] = await query(
      `SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
       FROM dm_messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.id = ?`,
      [result.insertId]
    )

    res.status(201).json({
      id: message.id,
      senderId: message.sender_id,
      senderName: message.sender_name,
      senderAvatar: message.sender_avatar,
      content: message.content,
      isRead: false,
      createdAt: message.created_at
    })
  } catch (error) {
    console.error('Error al enviar mensaje:', error)
    res.status(500).json({ message: 'Error al enviar mensaje' })
  }
})

// Buscar usuarios para iniciar conversación
app.get('/users/search', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query
    const userId = req.user.id

    if (!q || q.length < 2) {
      return res.json([])
    }

    const term = `%${sanitizeInput(q)}%`
    const users = await query(
      `SELECT id, name, nickname, avatar_url 
       FROM users 
       WHERE id != ? AND (name LIKE ? OR nickname LIKE ? OR email LIKE ?)
       LIMIT 20`,
      [userId, term, term, term]
    )

    res.json(users)
  } catch (error) {
    console.error('Error al buscar usuarios:', error)
    res.status(500).json({ message: 'Error al buscar usuarios' })
  }
})

app.listen(PORT, () => {
  console.log(`Messaging Service ejecutándose en puerto ${PORT}`)
})
