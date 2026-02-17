import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { query } from '../shared/database.js'
import { authMiddleware } from '../shared/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4006

app.use(cors())
app.use(express.json())

// Recomendar contenidos basados en cursos del usuario
app.get('/recommendations/content', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const { limit = 10 } = req.query

    // Obtener cursos del usuario
    const userCourses = await query(
      'SELECT course_id FROM user_courses WHERE user_id = ?',
      [userId]
    )

    if (userCourses.length === 0) {
      return res.json([])
    }

    const courseIds = userCourses.map(uc => uc.course_id)
    const placeholders = courseIds.map(() => '?').join(',')

    // Recomendar publicaciones populares de esos cursos
    const recommendations = await query(
      `SELECT p.*, u.name as author_name,
        (SELECT COUNT(*) FROM votes WHERE publication_id = p.id AND vote_type = 'up') as upvotes
       FROM publications p
       JOIN users u ON p.user_id = u.id
       WHERE p.course_id IN (${placeholders})
         AND p.user_id != ?
       ORDER BY upvotes DESC, p.created_at DESC
       LIMIT ?`,
      [...courseIds, userId, parseInt(limit)]
    )

    res.json(recommendations)
  } catch (error) {
    console.error('Error al obtener recomendaciones:', error)
    res.status(500).json({ message: 'Error al obtener recomendaciones' })
  }
})

// Recomendar usuarios para seguir
app.get('/recommendations/users', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const { limit = 10 } = req.query

    // Recomendar usuarios con alta reputación en los mismos cursos
    const userCourses = await query(
      'SELECT course_id FROM user_courses WHERE user_id = ?',
      [userId]
    )

    if (userCourses.length === 0) {
      // Si no tiene cursos, recomendar top usuarios globales
      const topUsers = await query(
        `SELECT u.*, r.points, r.level, r.badge
         FROM users u
         JOIN reputation r ON u.id = r.user_id
         WHERE u.id != ?
         ORDER BY r.points DESC
         LIMIT ?`,
        [userId, parseInt(limit)]
      )
      return res.json(topUsers)
    }

    const courseIds = userCourses.map(uc => uc.course_id)
    const placeholders = courseIds.map(() => '?').join(',')

    const recommendations = await query(
      `SELECT DISTINCT u.*, r.points, r.level, r.badge
       FROM users u
       JOIN user_courses uc ON u.id = uc.user_id
       JOIN reputation r ON u.id = r.user_id
       WHERE uc.course_id IN (${placeholders})
         AND u.id != ?
       ORDER BY r.points DESC
       LIMIT ?`,
      [...courseIds, userId, parseInt(limit)]
    )

    res.json(recommendations)
  } catch (error) {
    console.error('Error al obtener recomendaciones:', error)
    res.status(500).json({ message: 'Error al obtener recomendaciones' })
  }
})

// Recomendar apuntes relevantes
app.get('/recommendations/notes', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const { courseId, limit = 10 } = req.query

    let sql = `
      SELECT n.*, u.name as author_name,
        (SELECT COUNT(DISTINCT user_id) FROM note_edits WHERE note_id = n.id) as collaborators
      FROM notes n
      JOIN users u ON n.user_id = u.id
      WHERE n.user_id != ?
    `

    const params = [userId]

    if (courseId) {
      sql += ' AND n.course_id = ?'
      params.push(courseId)
    } else {
      // Recomendar de cursos del usuario
      const userCourses = await query(
        'SELECT course_id FROM user_courses WHERE user_id = ?',
        [userId]
      )

      if (userCourses.length > 0) {
        const courseIds = userCourses.map(uc => uc.course_id)
        const placeholders = courseIds.map(() => '?').join(',')
        sql += ` AND n.course_id IN (${placeholders})`
        params.push(...courseIds)
      }
    }

    sql += ' ORDER BY n.updated_at DESC LIMIT ?'
    params.push(parseInt(limit))

    const recommendations = await query(sql, params)

    res.json(recommendations)
  } catch (error) {
    console.error('Error al obtener recomendaciones:', error)
    res.status(500).json({ message: 'Error al obtener recomendaciones' })
  }
})

// Recomendar cursos similares
app.get('/recommendations/courses', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const { limit = 10 } = req.query

    // Obtener cursos en los que no está inscrito pero son populares
    const recommendations = await query(
      `SELECT c.*, COUNT(uc.user_id) as enrolled_count
       FROM courses c
       JOIN user_courses uc ON c.id = uc.course_id
       WHERE c.id NOT IN (SELECT course_id FROM user_courses WHERE user_id = ?)
       GROUP BY c.id
       ORDER BY enrolled_count DESC
       LIMIT ?`,
      [userId, parseInt(limit)]
    )

    res.json(recommendations)
  } catch (error) {
    console.error('Error al obtener recomendaciones:', error)
    res.status(500).json({ message: 'Error al obtener recomendaciones' })
  }
})

app.listen(PORT, () => {
  console.log(`Recommendation Service ejecutándose en puerto ${PORT}`)
})
