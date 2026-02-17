import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { query } from '../shared/database.js'
import { authMiddleware } from '../shared/auth.js'
import { sanitizeInput } from '../shared/validation.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4002

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Obtener perfil de usuario
app.get('/users/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params

    const users = await query(
      `SELECT id, name, email, university, career, bio, avatar_url, nickname, created_at 
       FROM users WHERE id = ?`,
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    // Obtener conteo de contribuciones
    const contributions = await query(
      `SELECT 
        (SELECT COUNT(*) FROM publications WHERE user_id = ?) as publications_count,
        (SELECT COUNT(*) FROM comments WHERE user_id = ?) as comments_count,
        (SELECT COUNT(*) FROM notes WHERE user_id = ?) as notes_count`,
      [userId, userId, userId]
    )

    res.json({
      ...users[0],
      contributionsCount: 
        (contributions[0].publications_count || 0) + 
        (contributions[0].comments_count || 0) + 
        (contributions[0].notes_count || 0)
    })
  } catch (error) {
    console.error('Error al obtener perfil:', error)
    res.status(500).json({ message: 'Error al obtener perfil' })
  }
})

// Actualizar perfil
app.put('/users/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params
    const { name, university, career, bio, nickname, avatar_url } = req.body

    // Verificar que el usuario esté actualizando su propio perfil
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'No autorizado' })
    }

    // Construir query dinámicamente para manejar campos opcionales
    const updates = []
    const values = []

    if (name !== undefined) {
      updates.push('name = ?')
      values.push(sanitizeInput(name))
    }
    if (university !== undefined) {
      updates.push('university = ?')
      values.push(sanitizeInput(university))
    }
    if (career !== undefined) {
      updates.push('career = ?')
      values.push(sanitizeInput(career))
    }
    if (bio !== undefined) {
      updates.push('bio = ?')
      values.push(sanitizeInput(bio))
    }
    if (nickname !== undefined) {
      updates.push('nickname = ?')
      values.push(sanitizeInput(nickname))
    }
    if (avatar_url !== undefined) {
      updates.push('avatar_url = ?')
      values.push(avatar_url || null)
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No hay datos para actualizar' })
    }

    values.push(userId)
    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    res.json({ message: 'Perfil actualizado exitosamente' })
  } catch (error) {
    console.error('Error al actualizar perfil:', error)
    res.status(500).json({ message: 'Error al actualizar perfil' })
  }
})

// Obtener cursos del usuario
app.get('/users/:userId/courses', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params

    const courses = await query(
      `SELECT c.* FROM courses c
       JOIN user_courses uc ON c.id = uc.course_id
       WHERE uc.user_id = ?`,
      [userId]
    )

    res.json(courses)
  } catch (error) {
    console.error('Error al obtener cursos:', error)
    res.status(500).json({ message: 'Error al obtener cursos' })
  }
})

// Inscribirse en un curso
app.post('/users/courses/:courseId/enroll', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params
    const userId = req.user.id

    // Verificar si ya está inscrito
    const enrolled = await query(
      'SELECT * FROM user_courses WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    )

    if (enrolled.length > 0) {
      return res.status(400).json({ message: 'Ya estás inscrito en este curso' })
    }

    await query(
      'INSERT INTO user_courses (user_id, course_id) VALUES (?, ?)',
      [userId, courseId]
    )

    res.json({ message: 'Inscrito exitosamente' })
  } catch (error) {
    console.error('Error al inscribir:', error)
    res.status(500).json({ message: 'Error al inscribir en curso' })
  }
})

// Obtener reputación del usuario
app.get('/users/:userId/reputation', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params

    const reputation = await query(
      'SELECT * FROM reputation WHERE user_id = ?',
      [userId]
    )

    if (reputation.length === 0) {
      return res.json({
        points: 0,
        level: 1,
        user_rank: null,
        badge: 'Principiante'
      })
    }

    res.json(reputation[0])
  } catch (error) {
    console.error('Error al obtener reputación:', error)
    res.status(500).json({ message: 'Error al obtener reputación' })
  }
})

// Obtener actividad del usuario
app.get('/users/:userId/activity', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params

    const activity = await query(
      `SELECT 
        (SELECT COUNT(*) FROM publications WHERE user_id = ?) as publicationsCount,
        (SELECT COUNT(*) FROM comments WHERE user_id = ?) as commentsCount,
        (SELECT COUNT(*) FROM notes WHERE user_id = ?) as notesCount,
        (SELECT COUNT(*) FROM note_edits WHERE user_id = ?) as editsCount,
        (SELECT COALESCE(SUM(votes), 0) FROM publications WHERE user_id = ?) as upvotesReceived`,
      [userId, userId, userId, userId, userId]
    )

    res.json({
      ...activity[0],
      featuredContent: 0,
      achievements: 0,
      helpedStudents: 0,
      viewsCount: 0,
      sharesCount: 0,
      recentAchievements: []
    })
  } catch (error) {
    console.error('Error al obtener actividad:', error)
    res.status(500).json({ message: 'Error al obtener actividad' })
  }
})

app.listen(PORT, () => {
  console.log(`User Service ejecutándose en puerto ${PORT}`)
})
