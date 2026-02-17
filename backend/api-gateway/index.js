import express from 'express'
import cors from 'cors'
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Configuración de servicios
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
  users: process.env.USER_SERVICE_URL || 'http://localhost:4002',
  content: process.env.CONTENT_SERVICE_URL || 'http://localhost:4003',
  collaboration: process.env.COLLABORATION_SERVICE_URL || 'http://localhost:4004',
  reputation: process.env.REPUTATION_SERVICE_URL || 'http://localhost:4005',
  recommendation: process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:4006',
  chatbot: process.env.CHATBOT_SERVICE_URL || 'http://localhost:4007',
  messaging: process.env.MESSAGING_SERVICE_URL || 'http://localhost:4008'
}

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 peticiones por ventana
  message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.'
})

app.use('/api/', limiter)

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  })
})

// Proxy para servicio de autenticación
app.use('/api/auth', createProxyMiddleware({
  target: services.auth,
  changeOrigin: true,
  timeout: 30000, // 30 segundos de timeout
  proxyTimeout: 30000,
  pathRewrite: {
    '^/api/auth': ''
  },
  onProxyReq: (proxyReq, req, res) => {
    fixRequestBody(proxyReq, req) // Reenvía el body que express.json() consumió
    console.log('🔄 Proxy Auth: Enviando petición a', req.method, req.url)
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('✅ Proxy Auth: Respuesta recibida', proxyRes.statusCode)
  },
  onError: (err, req, res) => {
    console.error('❌ Error en proxy auth:', err.code, err.message)
    res.status(500).json({ message: 'Error al conectar con servicio de autenticación' })
  }
}))

// Proxy para servicio de usuarios
app.use('/api/users', createProxyMiddleware({
  target: services.users,
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/users'
  },
  onProxyReq: fixRequestBody,
  onError: (err, req, res) => {
    console.error('Error en proxy users:', err)
    res.status(500).json({ message: 'Error al conectar con servicio de usuarios' })
  }
}))

// Proxy para servicio de contenidos
app.use('/api/content', createProxyMiddleware({
  target: services.content,
  changeOrigin: true,
  pathRewrite: {
    '^/api/content': ''
  },
  onProxyReq: fixRequestBody,
  onError: (err, req, res) => {
    console.error('Error en proxy content:', err)
    res.status(500).json({ message: 'Error al conectar con servicio de contenidos' })
  }
}))

// Proxy para servicio de colaboración (WebSocket)
app.use('/api/collaboration', createProxyMiddleware({
  target: services.collaboration,
  changeOrigin: true,
  ws: true, // Habilitar WebSocket
  pathRewrite: {
    '^/api/collaboration': ''
  },
  onProxyReq: fixRequestBody,
  onError: (err, req, res) => {
    console.error('Error en proxy collaboration:', err)
    res.status(500).json({ message: 'Error al conectar con servicio de colaboración' })
  }
}))

// Proxy para servicio de reputación
app.use('/api/reputation', createProxyMiddleware({
  target: services.reputation,
  changeOrigin: true,
  pathRewrite: {
    '^/api/reputation': '/reputation'
  },
  onProxyReq: fixRequestBody,
  onError: (err, req, res) => {
    console.error('Error en proxy reputation:', err)
    res.status(500).json({ message: 'Error al conectar con servicio de reputación' })
  }
}))

// Proxy para servicio de recomendaciones
app.use('/api/recommendations', createProxyMiddleware({
  target: services.recommendation,
  changeOrigin: true,
  pathRewrite: {
    '^/api/recommendations': '/recommendations'
  },
  onProxyReq: fixRequestBody,
  onError: (err, req, res) => {
    console.error('Error en proxy recommendations:', err)
    res.status(500).json({ message: 'Error al conectar con servicio de recomendaciones' })
  }
}))

// Proxy para servicio de chatbot
app.use('/api/chatbot', createProxyMiddleware({
  target: services.chatbot,
  changeOrigin: true,
  pathRewrite: {
    '^/api/chatbot': ''
  },
  onProxyReq: fixRequestBody,
  onError: (err, req, res) => {
    console.error('Error en proxy chatbot:', err)
    res.status(500).json({ message: 'Error al conectar con servicio de chatbot' })
  }
}))

// Proxy para servicio de mensajería
app.use('/api/messaging', createProxyMiddleware({
  target: services.messaging,
  changeOrigin: true,
  pathRewrite: {
    '^/api/messaging': ''
  },
  onProxyReq: fixRequestBody,
  onError: (err, req, res) => {
    console.error('Error en proxy messaging:', err)
    res.status(500).json({ message: 'Error al conectar con servicio de mensajería' })
  }
}))

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' })
})

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en API Gateway:', err)
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

app.listen(PORT, () => {
  console.log(`API Gateway ejecutándose en puerto ${PORT}`)
  console.log('Servicios configurados:')
  Object.entries(services).forEach(([name, url]) => {
    console.log(`  - ${name}: ${url}`)
  })
})
