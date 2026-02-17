import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { query } from '../shared/database.js'
import { authMiddleware } from '../shared/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4005

app.use(cors())
app.use(express.json())

// Constantes para cálculo de reputación
const POINTS = {
  PUBLICATION: 10,
  COMMENT: 5,
  NOTE: 15,
  VOTE_RECEIVED: 2,
  EDIT_NOTE: 8
}

const LEVEL_THRESHOLD = 100 // Puntos necesarios por nivel

// Calcular nivel basado en puntos
const calculateLevel = (points) => {
  return Math.floor(points / LEVEL_THRESHOLD) + 1
}

// Determinar badge según nivel
const getBadge = (level) => {
  if (level >= 10) return 'Experto'
  if (level >= 7) return 'Avanzado'
  if (level >= 4) return 'Intermedio'
  if (level >= 2) return 'Aprendiz'
  return 'Principiante'
}

// Agregar puntos a un usuario
app.post('/reputation/add-points', authMiddleware, async (req, res) => {
  try {
    const { userId, actionType, points } = req.body

    // Obtener reputación actual
    let reputation = await query(
      'SELECT * FROM reputation WHERE user_id = ?',
      [userId]
    )

    const actionPoints = points || POINTS[actionType] || 0

    if (reputation.length === 0) {
      // Crear registro de reputación
      await query(
        'INSERT INTO reputation (user_id, points, level, badge) VALUES (?, ?, ?, ?)',
        [userId, actionPoints, 1, 'Principiante']
      )
    } else {
      // Actualizar puntos
      const newPoints = reputation[0].points + actionPoints
      const newLevel = calculateLevel(newPoints)
      const newBadge = getBadge(newLevel)

      await query(
        'UPDATE reputation SET points = ?, level = ?, badge = ? WHERE user_id = ?',
        [newPoints, newLevel, newBadge, userId]
      )
    }

    res.json({ message: 'Puntos agregados', points: actionPoints })
  } catch (error) {
    console.error('Error al agregar puntos:', error)
    res.status(500).json({ message: 'Error al agregar puntos' })
  }
})

// Obtener ranking global
app.get('/reputation/ranking', authMiddleware, async (req, res) => {
  try {
    const { limit = 50 } = req.query

    const ranking = await query(
      `SELECT r.*, u.name, u.university
       FROM reputation r
       JOIN users u ON r.user_id = u.id
       ORDER BY r.points DESC
       LIMIT ?`,
      [parseInt(limit)]
    )

    res.json(ranking)
  } catch (error) {
    console.error('Error al obtener ranking:', error)
    res.status(500).json({ message: 'Error al obtener ranking' })
  }
})

// Obtener ranking por universidad
app.get('/reputation/ranking/university/:university', authMiddleware, async (req, res) => {
  try {
    const { university } = req.params
    const { limit = 50 } = req.query

    const ranking = await query(
      `SELECT r.*, u.name
       FROM reputation r
       JOIN users u ON r.user_id = u.id
       WHERE u.university = ?
       ORDER BY r.points DESC
       LIMIT ?`,
      [university, parseInt(limit)]
    )

    res.json(ranking)
  } catch (error) {
    console.error('Error al obtener ranking:', error)
    res.status(500).json({ message: 'Error al obtener ranking' })
  }
})

// Obtener posición en ranking
app.get('/reputation/rank/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params

    const rankResult = await query(
      `SELECT COUNT(*) + 1 as user_rank
       FROM reputation
       WHERE points > (SELECT points FROM reputation WHERE user_id = ?)`,
      [userId]
    )

    res.json({ user_rank: rankResult[0].user_rank })
  } catch (error) {
    console.error('Error al obtener ranking:', error)
    res.status(500).json({ message: 'Error al obtener ranking' })
  }
})

// Recalcular reputación de un usuario (útil para correcciones)
app.post('/reputation/recalculate/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params

    // Contar todas las contribuciones
    const stats = await query(
      `SELECT 
        (SELECT COUNT(*) FROM publications WHERE user_id = ?) as publications,
        (SELECT COUNT(*) FROM comments WHERE user_id = ?) as comments,
        (SELECT COUNT(*) FROM notes WHERE user_id = ?) as notes,
        (SELECT COUNT(*) FROM note_edits WHERE user_id = ?) as edits,
        (SELECT COUNT(*) FROM votes v 
         JOIN publications p ON v.publication_id = p.id 
         WHERE p.user_id = ? AND v.vote_type = 'up') as votes_received`,
      [userId, userId, userId, userId, userId]
    )

    const totalPoints = 
      (stats[0].publications * POINTS.PUBLICATION) +
      (stats[0].comments * POINTS.COMMENT) +
      (stats[0].notes * POINTS.NOTE) +
      (stats[0].edits * POINTS.EDIT_NOTE) +
      (stats[0].votes_received * POINTS.VOTE_RECEIVED)

    const level = calculateLevel(totalPoints)
    const badge = getBadge(level)

    // Actualizar o insertar
    const existing = await query('SELECT * FROM reputation WHERE user_id = ?', [userId])

    if (existing.length === 0) {
      await query(
        'INSERT INTO reputation (user_id, points, level, badge) VALUES (?, ?, ?, ?)',
        [userId, totalPoints, level, badge]
      )
    } else {
      await query(
        'UPDATE reputation SET points = ?, level = ?, badge = ? WHERE user_id = ?',
        [totalPoints, level, badge, userId]
      )
    }

    res.json({ 
      message: 'Reputación recalculada',
      points: totalPoints,
      level,
      badge
    })
  } catch (error) {
    console.error('Error al recalcular reputación:', error)
    res.status(500).json({ message: 'Error al recalcular reputación' })
  }
})

app.listen(PORT, () => {
  console.log(`Reputation Service ejecutándose en puerto ${PORT}`)
})
