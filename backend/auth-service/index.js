import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import { query } from '../shared/database.js'
import { generateToken, verifyToken, authMiddleware } from '../shared/auth.js'
import { validateEmail, validatePassword, validateRequired, sanitizeInput } from '../shared/validation.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4001

app.use(cors())
app.use(express.json())

// Registro de usuarios
app.post('/register', async (req, res) => {
  console.log('📥 Petición de registro recibida:', req.body)
  try {
    const { name, email, password, university, career } = req.body

    // Validar campos requeridos
    const missing = validateRequired(['name', 'email', 'password', 'university', 'career'], req.body)
    if (missing.length > 0) {
      return res.status(400).json({ 
        message: `Campos requeridos faltantes: ${missing.join(', ')}` 
      })
    }

    // Validar email
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Email inválido' })
    }

    // Validar contraseña
    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' })
    }

    // Verificar si el usuario ya existe
    console.log('🔍 Verificando si el email existe...')
    const existingUser = await query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    )
    console.log('✅ Verificación completada')

    if (existingUser.length > 0) {
      console.log('⚠️ Email ya registrado')
      return res.status(400).json({ message: 'El email ya está registrado' })
    }

    // Hash de la contraseña
    console.log('🔐 Hasheando contraseña...')
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log('✅ Hash completado')

    // Insertar usuario
    console.log('💾 Insertando usuario en la base de datos...')
    const result = await query(
      'INSERT INTO users (name, email, password, university, career) VALUES (?, ?, ?, ?, ?)',
      [sanitizeInput(name), email, hashedPassword, sanitizeInput(university), sanitizeInput(career)]
    )
    console.log('✅ Usuario insertado con ID:', result.insertId)

    const userId = result.insertId

    // Generar token
    const token = generateToken({ 
      id: userId, 
      email, 
      name 
    })

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: userId,
        name,
        email,
        university,
        career
      }
    })
  } catch (error) {
    console.error('Error en registro:', error)
    res.status(500).json({ message: 'Error al registrar usuario' })
  }
})

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' })
    }

    // Buscar usuario
    const users = await query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )

    if (users.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' })
    }

    const user = users[0]

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' })
    }

    // Generar token
    const token = generateToken({ 
      id: user.id, 
      email: user.email, 
      name: user.name 
    })

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        university: user.university,
        career: user.career,
        avatar_url: user.avatar_url || null,
        nickname: user.nickname || null
      }
    })
  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({ message: 'Error al iniciar sesión' })
  }
})

// Verificar token
app.get('/verify', authMiddleware, (req, res) => {
  res.json({
    message: 'Token válido',
    user: req.user
  })
})

// Refresh token
app.post('/refresh', authMiddleware, (req, res) => {
  const newToken = generateToken({ 
    id: req.user.id, 
    email: req.user.email, 
    name: req.user.name 
  })

  res.json({
    message: 'Token renovado',
    token: newToken
  })
})

app.listen(PORT, () => {
  console.log(`✅ Auth Service ejecutándose en puerto ${PORT}`)
  console.log(`📊 Base de datos: ${process.env.DB_NAME}`)
  console.log(`🔐 Usuario DB: ${process.env.DB_USER}`)
  console.log(`🏠 Host DB: ${process.env.DB_HOST}`)
  console.log(`✅ JWT Secret configurado: ${process.env.JWT_SECRET ? 'Sí' : 'No'}`)
})
