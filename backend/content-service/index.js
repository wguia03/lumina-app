import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { query } from '../shared/database.js'
import { authMiddleware } from '../shared/auth.js'
import { sanitizeInput, validateRequired } from '../shared/validation.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4003

app.use(cors())
app.use(express.json())

// PUBLICACIONES

// Obtener publicaciones
app.get('/publications', authMiddleware, async (req, res) => {
  try {
    const { filter } = req.query
    let sql = `
      SELECT p.*, u.name as author_name, u.email as author_email,
        (SELECT COUNT(*) FROM votes WHERE publication_id = p.id AND reaction_type = 'like') as likes,
        (SELECT COUNT(*) FROM votes WHERE publication_id = p.id AND reaction_type = 'love') as loves,
        (SELECT COUNT(*) FROM votes WHERE publication_id = p.id AND reaction_type = 'insightful') as insightful,
        (SELECT COUNT(*) FROM votes WHERE publication_id = p.id AND reaction_type = 'support') as support,
        (SELECT COUNT(*) FROM votes WHERE publication_id = p.id AND reaction_type = 'thinking') as thinking,
        (SELECT COUNT(*) FROM votes WHERE publication_id = p.id) as totalReactions,
        (SELECT reaction_type FROM votes WHERE publication_id = p.id AND user_id = ?) as userReaction,
        (SELECT COUNT(*) FROM comments WHERE publication_id = p.id) as commentsCount
      FROM publications p
      JOIN users u ON p.user_id = u.id
    `

    if (filter === 'my-courses') {
      sql += ` WHERE p.course_id IN (SELECT course_id FROM user_courses WHERE user_id = ?)`
    } else if (filter === 'trending') {
      sql += ` ORDER BY totalReactions DESC`
    }

    sql += ` ORDER BY p.created_at DESC LIMIT 50`

    const params = filter === 'my-courses' ? [req.user.id, req.user.id] : [req.user.id]
    const publications = await query(sql, params)

    const formatted = publications.map(pub => ({
      id: pub.id,
      title: pub.title,
      content: pub.content,
      tags: pub.tags ? pub.tags.split(',') : [],
      userId: pub.user_id,
      author: {
        name: pub.author_name,
        email: pub.author_email
      },
      reactions: {
        like: pub.likes || 0,
        love: pub.loves || 0,
        insightful: pub.insightful || 0,
        support: pub.support || 0,
        thinking: pub.thinking || 0
      },
      totalReactions: pub.totalReactions || 0,
      userReaction: pub.userReaction || null,
      commentsCount: pub.commentsCount || 0,
      createdAt: pub.created_at
    }))

    res.json(formatted)
  } catch (error) {
    console.error('Error al obtener publicaciones:', error)
    res.status(500).json({ message: 'Error al obtener publicaciones' })
  }
})

// Obtener publicación por ID
app.get('/publications/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const publications = await query(
      `SELECT p.*, u.name as author_name
       FROM publications p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [id]
    )

    if (publications.length === 0) {
      return res.status(404).json({ message: 'Publicación no encontrada' })
    }

    res.json(publications[0])
  } catch (error) {
    console.error('Error al obtener publicación:', error)
    res.status(500).json({ message: 'Error al obtener publicación' })
  }
})

// Crear publicación
app.post('/publications', authMiddleware, async (req, res) => {
  try {
    const { title, content, tags } = req.body
    const userId = req.user.id

    const missing = validateRequired(['title', 'content'], req.body)
    if (missing.length > 0) {
      return res.status(400).json({ message: `Campos requeridos: ${missing.join(', ')}` })
    }

    const tagsString = Array.isArray(tags) ? tags.join(',') : ''

    const result = await query(
      'INSERT INTO publications (user_id, title, content, tags) VALUES (?, ?, ?, ?)',
      [userId, sanitizeInput(title), sanitizeInput(content), tagsString]
    )

    res.status(201).json({
      id: result.insertId,
      title,
      content,
      tags,
      userId,
      author: { name: req.user.name },
      upvotes: 0,
      downvotes: 0,
      commentsCount: 0,
      createdAt: new Date()
    })
  } catch (error) {
    console.error('Error al crear publicación:', error)
    res.status(500).json({ message: 'Error al crear publicación' })
  }
})

// Actualizar publicación
app.put('/publications/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { title, content, tags } = req.body

    // Verificar propiedad
    const publications = await query('SELECT user_id FROM publications WHERE id = ?', [id])
    if (publications.length === 0) {
      return res.status(404).json({ message: 'Publicación no encontrada' })
    }
    if (publications[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'No autorizado' })
    }

    const tagsString = Array.isArray(tags) ? tags.join(',') : tags

    await query(
      'UPDATE publications SET title = ?, content = ?, tags = ? WHERE id = ?',
      [sanitizeInput(title), sanitizeInput(content), tagsString, id]
    )

    res.json({ message: 'Publicación actualizada' })
  } catch (error) {
    console.error('Error al actualizar publicación:', error)
    res.status(500).json({ message: 'Error al actualizar publicación' })
  }
})

// Eliminar publicación
app.delete('/publications/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    // Verificar propiedad
    const publications = await query('SELECT user_id FROM publications WHERE id = ?', [id])
    if (publications.length === 0) {
      return res.status(404).json({ message: 'Publicación no encontrada' })
    }
    if (publications[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'No autorizado' })
    }

    await query('DELETE FROM publications WHERE id = ?', [id])

    res.json({ message: 'Publicación eliminada' })
  } catch (error) {
    console.error('Error al eliminar publicación:', error)
    res.status(500).json({ message: 'Error al eliminar publicación' })
  }
})

// COMENTARIOS

// Obtener comentarios de una publicación
app.get('/publications/:publicationId/comments', authMiddleware, async (req, res) => {
  try {
    const { publicationId } = req.params

    const comments = await query(
      `SELECT c.*, u.name as author_name
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.publication_id = ?
       ORDER BY c.created_at ASC`,
      [publicationId]
    )

    const formatted = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      author: { name: comment.author_name },
      createdAt: comment.created_at
    }))

    res.json(formatted)
  } catch (error) {
    console.error('Error al obtener comentarios:', error)
    res.status(500).json({ message: 'Error al obtener comentarios' })
  }
})

// Crear comentario
app.post('/publications/:publicationId/comments', authMiddleware, async (req, res) => {
  try {
    const { publicationId } = req.params
    const { content } = req.body
    const userId = req.user.id

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'El contenido es requerido' })
    }

    const result = await query(
      'INSERT INTO comments (user_id, publication_id, content) VALUES (?, ?, ?)',
      [userId, publicationId, sanitizeInput(content)]
    )

    res.status(201).json({
      id: result.insertId,
      content,
      author: { name: req.user.name },
      createdAt: new Date()
    })
  } catch (error) {
    console.error('Error al crear comentario:', error)
    res.status(500).json({ message: 'Error al crear comentario' })
  }
})

// Eliminar comentario
app.delete('/comments/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    // Verificar propiedad
    const comments = await query('SELECT user_id FROM comments WHERE id = ?', [id])
    if (comments.length === 0) {
      return res.status(404).json({ message: 'Comentario no encontrado' })
    }
    if (comments[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'No autorizado' })
    }

    await query('DELETE FROM comments WHERE id = ?', [id])

    res.json({ message: 'Comentario eliminado' })
  } catch (error) {
    console.error('Error al eliminar comentario:', error)
    res.status(500).json({ message: 'Error al eliminar comentario' })
  }
})

// VOTOS

// Reaccionar a publicación
app.post('/publications/:publicationId/react', authMiddleware, async (req, res) => {
  try {
    const { publicationId } = req.params
    const { reactionType } = req.body
    const userId = req.user.id

    const validReactions = ['like', 'love', 'insightful', 'support', 'thinking']
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ message: 'Tipo de reacción inválido' })
    }

    // Verificar si ya reaccionó
    const existing = await query(
      'SELECT * FROM votes WHERE user_id = ? AND publication_id = ?',
      [userId, publicationId]
    )

    if (existing.length > 0) {
      // Si es la misma reacción, eliminarla (toggle)
      if (existing[0].reaction_type === reactionType) {
        await query(
          'DELETE FROM votes WHERE user_id = ? AND publication_id = ?',
          [userId, publicationId]
        )
        return res.json({ message: 'Reacción eliminada', reaction: null })
      }
      
      // Actualizar reacción
      await query(
        'UPDATE votes SET reaction_type = ? WHERE user_id = ? AND publication_id = ?',
        [reactionType, userId, publicationId]
      )
    } else {
      // Insertar reacción
      await query(
        'INSERT INTO votes (user_id, publication_id, reaction_type) VALUES (?, ?, ?)',
        [userId, publicationId, reactionType]
      )
    }

    res.json({ message: 'Reacción registrada', reaction: reactionType })
  } catch (error) {
    console.error('Error al reaccionar:', error)
    res.status(500).json({ message: 'Error al reaccionar' })
  }
})

// Obtener reacciones de una publicación
app.get('/publications/:publicationId/reactions', authMiddleware, async (req, res) => {
  try {
    const { publicationId } = req.params

    const reactions = await query(
      `SELECT reaction_type, COUNT(*) as count
       FROM votes 
       WHERE publication_id = ?
       GROUP BY reaction_type`,
      [publicationId]
    )

    const formatted = {
      like: 0,
      love: 0,
      insightful: 0,
      support: 0,
      thinking: 0
    }

    reactions.forEach(r => {
      formatted[r.reaction_type] = r.count
    })

    res.json(formatted)
  } catch (error) {
    console.error('Error al obtener reacciones:', error)
    res.status(500).json({ message: 'Error al obtener reacciones' })
  }
})

// APUNTES (NOTES)

// Obtener apuntes
app.get('/notes', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.query

    let sql = `
      SELECT n.*, u.name as author_name,
        (SELECT COUNT(DISTINCT user_id) FROM note_edits WHERE note_id = n.id) as collaboratorsCount
      FROM notes n
      JOIN users u ON n.user_id = u.id
    `

    const params = []
    if (courseId) {
      sql += ' WHERE n.course_id = ?'
      params.push(courseId)
    }

    sql += ' ORDER BY n.updated_at DESC'

    const notes = await query(sql, params)

    const formatted = notes.map(note => ({
      id: note.id,
      title: note.title,
      preview: note.content ? note.content.substring(0, 200) : '',
      author: { name: note.author_name },
      collaboratorsCount: note.collaboratorsCount || 1,
      updatedAt: note.updated_at,
      views: 0,
      likes: 0
    }))

    res.json(formatted)
  } catch (error) {
    console.error('Error al obtener apuntes:', error)
    res.status(500).json({ message: 'Error al obtener apuntes' })
  }
})

// Obtener apunte por ID
app.get('/notes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const notes = await query('SELECT * FROM notes WHERE id = ?', [id])

    if (notes.length === 0) {
      return res.status(404).json({ message: 'Apunte no encontrado' })
    }

    res.json(notes[0])
  } catch (error) {
    console.error('Error al obtener apunte:', error)
    res.status(500).json({ message: 'Error al obtener apunte' })
  }
})

// Crear apunte
app.post('/notes', authMiddleware, async (req, res) => {
  try {
    const { title, content, courseId } = req.body
    const userId = req.user.id

    const missing = validateRequired(['title'], req.body)
    if (missing.length > 0) {
      return res.status(400).json({ message: `Campos requeridos: ${missing.join(', ')}` })
    }

    const result = await query(
      'INSERT INTO notes (user_id, course_id, title, content) VALUES (?, ?, ?, ?)',
      [userId, courseId || null, sanitizeInput(title), sanitizeInput(content || '')]
    )

    res.status(201).json({
      id: result.insertId,
      title,
      content,
      courseId
    })
  } catch (error) {
    console.error('Error al crear apunte:', error)
    res.status(500).json({ message: 'Error al crear apunte' })
  }
})

// Actualizar apunte
app.put('/notes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { title, content } = req.body
    const userId = req.user.id

    await query(
      'UPDATE notes SET title = ?, content = ?, updated_at = NOW() WHERE id = ?',
      [sanitizeInput(title), sanitizeInput(content), id]
    )

    // Registrar edición
    await query(
      'INSERT INTO note_edits (note_id, user_id) VALUES (?, ?)',
      [id, userId]
    )

    res.json({ message: 'Apunte actualizado' })
  } catch (error) {
    console.error('Error al actualizar apunte:', error)
    res.status(500).json({ message: 'Error al actualizar apunte' })
  }
})

app.listen(PORT, () => {
  console.log(`Content Service ejecutándose en puerto ${PORT}`)
})
