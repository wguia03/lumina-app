# Lumina - Red Social de Aprendizaje Colaborativo Inteligente

**Lumina** es una plataforma educativa donde los estudiantes co-crean conocimiento, la comunidad valida la calidad del contenido mediante reacciones y comentarios, y un sistema inteligente organiza, recomienda y resume informacion automaticamente.

---

## Descripcion General

Lumina combina principios de **computacion social**, **inteligencia colectiva** y **sistemas colaborativos** para crear un entorno de aprendizaje moderno. Los usuarios publican contenido academico, interactuan con reacciones multiples (Me gusta, Me encanta, Impactado, Apoyo, Interesante), se comunican por mensajeria directa y reciben asistencia de un chatbot con IA.

---

## Caracteristicas Principales

- **Publicaciones y Reacciones**: Sistema de foro con 5 tipos de reacciones estilo Facebook
- **Mensajeria Directa**: Chat en tiempo real entre usuarios
- **Chatbot con IA**: Asistente virtual integrado con OpenAI para resolver dudas y resumir contenido
- **Editor Colaborativo**: Edicion simultanea de documentos con WebSockets
- **Sistema de Reputacion**: Gamificacion con puntos, niveles e insignias
- **Recomendaciones Inteligentes**: Motor de sugerencias personalizadas basado en IA
- **Perfil Personalizable**: Avatar, nickname y datos academicos

---

## Arquitectura

El proyecto utiliza una **arquitectura de microservicios** con un API Gateway central.

### Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express (microservicios) |
| Base de Datos | MySQL 8+ |
| Tiempo Real | Socket.IO (WebSockets) |
| Autenticacion | JWT (JSON Web Tokens) |
| IA / Chatbot | OpenAI API |

### Servicios

| Servicio | Puerto | Descripcion |
|----------|--------|-------------|
| Frontend (Vite) | 3000 | Interfaz de usuario React |
| API Gateway | 4200 | Proxy central, enrutamiento |
| Foro-estudiantes | 4300 | Auth, BD MySQL, contenido, usuarios |

---

## Estructura del Proyecto

```
Lumina/
├── frontend/                    # Aplicacion React + Vite
│   ├── src/
│   │   ├── components/          # Navbar, PublicationCard, Chatbot, etc.
│   │   ├── pages/               # Feed, Messages, Profile, Login, Register
│   │   ├── services/            # Clientes API (auth, content, messaging, etc.)
│   │   ├── contexts/            # AuthContext (estado global de sesion)
│   │   └── hooks/               # Custom hooks
│   └── public/                  # Recursos estaticos (logo)
│
├── backend/                     # Backend Node.js
│   ├── microservicios-basico/   # Gateway, usuarios, cursos, temas, comentarios, chatbot
│   └── foro-estudiantes/        # Auth, BD MySQL, contenido
│
├── database/                    # Scripts SQL
│   ├── schemas/                 # Esquema principal y migraciones
│   └── seeds/                   # Datos de prueba
│
├── docs/                        # Documentacion adicional
│   ├── api/                     # Documentacion de endpoints
│   ├── architecture/            # Diagramas de arquitectura
│   └── deployment/              # Guias de despliegue en produccion
│
├── GUIA-EJECUCION.md            # Guia paso a paso para ejecutar el proyecto
└── package.json                 # Scripts npm y dependencias raiz
```

---

## Seguridad

- **JWT** para autenticacion y autorizacion en cada microservicio
- **Bcrypt** para hash de contrasenas
- **Rate Limiting** en el API Gateway para prevenir abuso
- **CORS** configurado para origenes permitidos
- **Validacion de entrada** en todos los endpoints

---

## Documentacion Adicional

- [Documentacion de la API](docs/api/README.md) - Endpoints y ejemplos de uso
- [Arquitectura del Sistema](docs/architecture/README.md) - Diagramas y flujos de datos
- [Guia de Despliegue](docs/deployment/README.md) - Vercel, Railway, AWS
- [Esquema de Base de Datos](database/README.md) - Tablas, relaciones e indices
- [Informe Tecnico Completo](INFORME-TECNICO-COMPLETO.md) - Documento academico detallado

---

## Licencia

Este proyecto esta bajo la licencia MIT. Ver [LICENSE](LICENSE) para mas detalles.
