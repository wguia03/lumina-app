import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import axios from 'axios'
import { query } from '../shared/database.js'
import { authMiddleware } from '../shared/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4007

app.use(cors())
app.use(express.json())

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const AI_MODEL = process.env.AI_MODEL || 'gpt-3.5-turbo'

// Llamar a la API de OpenAI
const callAI = async (messages) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: AI_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data.choices[0].message.content
  } catch (error) {
    console.error('Error al llamar a OpenAI:', error.response?.data || error.message)
    throw new Error('Error al procesar la solicitud con IA')
  }
}

// Crear nueva conversación
app.post('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id

    const result = await query(
      'INSERT INTO conversations (user_id) VALUES (?)',
      [userId]
    )

    res.json({
      id: result.insertId,
      userId,
      createdAt: new Date()
    })
  } catch (error) {
    console.error('Error al crear conversación:', error)
    res.status(500).json({ message: 'Error al crear conversación' })
  }
})

// Obtener historial de conversación
app.get('/conversations/:conversationId', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params
    const userId = req.user.id

    // Verificar que la conversación pertenece al usuario
    const conversations = await query(
      'SELECT * FROM conversations WHERE id = ? AND user_id = ?',
      [conversationId, userId]
    )

    if (conversations.length === 0) {
      return res.status(404).json({ message: 'Conversación no encontrada' })
    }

    // Obtener mensajes
    const messages = await query(
      'SELECT * FROM conversation_messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conversationId]
    )

    res.json({
      conversation: conversations[0],
      messages
    })
  } catch (error) {
    console.error('Error al obtener conversación:', error)
    res.status(500).json({ message: 'Error al obtener conversación' })
  }
})

// Enviar mensaje al chatbot
app.post('/message', authMiddleware, async (req, res) => {
  try {
    const { message, context } = req.body
    const userId = req.user.id
    const conversationId = context?.conversationId

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'El mensaje es requerido' })
    }

    // Obtener contexto del usuario (cursos, etc.)
    const userCourses = await query(
      `SELECT c.name FROM courses c
       JOIN user_courses uc ON c.id = uc.course_id
       WHERE uc.user_id = ?`,
      [userId]
    )

    const coursesContext = userCourses.map(c => c.name).join(', ')

    // Construir contexto para el AI
    const systemPrompt = `Eres un asistente académico virtual especializado en ayudar a estudiantes. 
El estudiante está inscrito en los siguientes cursos: ${coursesContext || 'ninguno aún'}.
Puedes ayudar a resumir apuntes, responder preguntas académicas, recomendar recursos de estudio y dar consejos de aprendizaje.
Sé conciso, claro y útil en tus respuestas.`

    // Obtener historial de mensajes si existe conversationId
    let conversationHistory = []
    if (conversationId) {
      const history = await query(
        'SELECT role, content FROM conversation_messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 10',
        [conversationId]
      )
      conversationHistory = history.map(h => ({ role: h.role, content: h.content }))
    }

    // Construir array de mensajes para la AI
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ]

    // Llamar a la AI
    const aiResponse = await callAI(aiMessages)

    // Guardar mensajes en la base de datos si hay conversationId
    if (conversationId) {
      await query(
        'INSERT INTO conversation_messages (conversation_id, role, content) VALUES (?, ?, ?)',
        [conversationId, 'user', message]
      )

      await query(
        'INSERT INTO conversation_messages (conversation_id, role, content) VALUES (?, ?, ?)',
        [conversationId, 'assistant', aiResponse]
      )
    }

    res.json({
      message: aiResponse,
      conversationId
    })
  } catch (error) {
    console.error('Error al procesar mensaje:', error)
    res.status(500).json({ 
      message: 'Error al procesar mensaje',
      error: error.message 
    })
  }
})

// Resumir apunte
app.post('/summarize', authMiddleware, async (req, res) => {
  try {
    const { noteId } = req.body

    if (!noteId) {
      return res.status(400).json({ message: 'noteId es requerido' })
    }

    // Obtener el apunte
    const notes = await query('SELECT * FROM notes WHERE id = ?', [noteId])

    if (notes.length === 0) {
      return res.status(404).json({ message: 'Apunte no encontrado' })
    }

    const note = notes[0]

    // Crear prompt para resumir
    const messages = [
      {
        role: 'system',
        content: 'Eres un asistente que ayuda a resumir apuntes académicos. Crea resúmenes concisos y útiles.'
      },
      {
        role: 'user',
        content: `Resume el siguiente apunte de manera concisa, destacando los puntos clave:\n\nTítulo: ${note.title}\n\nContenido: ${note.content}`
      }
    ]

    const summary = await callAI(messages)

    res.json({
      noteId,
      title: note.title,
      summary
    })
  } catch (error) {
    console.error('Error al resumir apunte:', error)
    res.status(500).json({ message: 'Error al resumir apunte' })
  }
})

// Obtener recomendaciones personalizadas
app.post('/recommendations', authMiddleware, async (req, res) => {
  try {
    const { type, context } = req.body
    const userId = req.user.id

    // Obtener información del usuario
    const users = await query('SELECT * FROM users WHERE id = ?', [userId])
    const user = users[0]

    const userCourses = await query(
      `SELECT c.name FROM courses c
       JOIN user_courses uc ON c.id = uc.course_id
       WHERE uc.user_id = ?`,
      [userId]
    )

    const coursesContext = userCourses.map(c => c.name).join(', ')

    let prompt = ''
    switch (type) {
      case 'study':
        prompt = `Como estudiante de ${user.career} en ${user.university}, inscrito en los cursos: ${coursesContext}, 
recomiéndame 3 recursos de estudio efectivos.`
        break
      case 'organization':
        prompt = `Soy estudiante de ${user.career}. Dame 3 consejos para organizar mejor mi tiempo de estudio.`
        break
      default:
        prompt = context || 'Dame recomendaciones generales para mejorar mi aprendizaje.'
    }

    const messages = [
      {
        role: 'system',
        content: 'Eres un asistente académico que da recomendaciones personalizadas de estudio.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]

    const recommendations = await callAI(messages)

    res.json({
      type,
      recommendations
    })
  } catch (error) {
    console.error('Error al obtener recomendaciones:', error)
    res.status(500).json({ message: 'Error al obtener recomendaciones' })
  }
})

app.listen(PORT, () => {
  console.log(`Chatbot Service ejecutándose en puerto ${PORT}`)
})
