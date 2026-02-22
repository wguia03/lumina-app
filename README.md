# Lumina - Red Social de Aprendizaje Colaborativo

Plataforma educativa donde los estudiantes co-crean conocimiento, la comunidad valida contenido mediante reacciones y comentarios, y un sistema inteligente organiza y recomienda información.

---

## Características

- **Publicaciones y Reacciones**: Foro con 5 tipos de reacciones (like, love, apoyo, genial, interesante)
- **Cursos y Apuntes**: Cursos académicos con apuntes colaborativos y recursos compartidos
- **Chatbot con IA**: Asistente virtual integrado con OpenAI
- **Mensajería Directa**: Chat entre usuarios
- **Sistema de Reputación**: Gamificación con puntos, niveles y logros
- **Perfil Personalizable**: Avatar, nickname, universidad, carrera

---

## Requisitos

| Software | Versión |
|----------|---------|
| Node.js | 18+ |
| npm | 9+ |
| MySQL | 8+ |
| Git | - |

---

## Inicio Rápido

### 1. Base de datos

**MySQL Workbench:** Abre `database/schemas/redsocial_FINAL.sql` y ejecuta todo. (⚠️ Incluye DROP DATABASE - borra datos existentes)

**Terminal:**
```bash
npm run db:init:redsocial
# o: mysql -u root -p < database/schemas/redsocial_FINAL.sql
```

### 2. Variables de entorno

```bash
cp backend/foro-estudiantes/.env.example backend/foro-estudiantes/.env
cp frontend/.env.example frontend/.env
```

Edita `backend/foro-estudiantes/.env` con tu contraseña de MySQL.

### 3. Instalar e iniciar

```bash
npm run install:all
npm run dev
```

### 4. URLs

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| API (auth, content) | http://localhost:4300 |
| Gateway | http://localhost:4200 |

---

## Estructura del Proyecto

```
Lumina/
├── frontend/                 # React + Vite (puerto 3000)
│   ├── src/
│   │   ├── components/       # Navbar, PublicationCard, Chatbot, etc.
│   │   ├── pages/            # Feed, CourseView, Profile, Login, Register
│   │   ├── services/         # API clients
│   │   └── contexts/         # AuthContext
│   └── public/
│
├── backend/
│   ├── foro-estudiantes/     # Auth, BD MySQL, contenido (puerto 4300)
│   │   ├── src/
│   │   │   ├── db/           # Conexión MySQL, usuarios
│   │   │   ├── services/     # auth, compat, usuarios, cursos, etc.
│   │   │   └── data/         # Store en memoria
│   │   └── scripts/          # check_schema.js
│   │
│   └── microservicios-basico/  # Gateway + microservicios (puerto 4200)
│       ├── api-gateway/
│       ├── usuarios/
│       ├── cursos/
│       ├── temas/
│       ├── comentarios/
│       └── chatbot/
│
├── database/
│   ├── schemas/              # redsocial_FINAL.sql
│   ├── seeds/                # Datos de ejemplo
│   └── scripts/              # init_redsocial.bat, init_redsocial.sh
│
├── docs/                     # Documentación extendida
│   ├── api/
│   ├── architecture/
│   └── deployment/
│
├── package.json
└── README.md
```

---

## Comandos npm

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia backend + frontend |
| `npm run install:all` | Instala dependencias |
| `npm run db:init:redsocial` | Crea BD (redsocial_FINAL.sql, incluye DROP) |
| `npm run db:seed:redsocial` | Carga datos de ejemplo |
| `npm run db:check` | Verifica esquema BD vs esperado |

---

## Base de Datos

**Tablas principales:** usuarios, cursos, inscripciones, publicaciones, publicacion_tags, comentarios, reacciones, seguidores, apuntes, recursos, reputacion, chatbot_*, dm_*, notificaciones, logros, usuario_logros.

**Configuración** en `backend/foro-estudiantes/.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=redsocial
```

**Verificar esquema:** `npm run db:check` genera reporte y migraciones si hay diferencias.

---

## Solución de Problemas

| Problema | Solución |
|----------|----------|
| Puerto en uso | `netstat -ano \| findstr :4300` → `taskkill /PID <pid> /F` |
| No conecta a BD | Verificar MySQL corriendo y credenciales en `.env` |
| Usuarios no se guardan | `DB_NAME=redsocial` en `.env`, foro en puerto 4300 |
| Cannot find module | `npm run install:all` |

---

## Documentación

- [API](docs/api/README.md) - Endpoints
- [Arquitectura](docs/architecture/README.md) - Diagramas
- [Despliegue](docs/deployment/README.md) - Producción
- [Informe Técnico](docs/INFORME-TECNICO-COMPLETO.md) - Documento académico

---

## Licencia

MIT. Ver [LICENSE](LICENSE).
