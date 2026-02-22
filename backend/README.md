# Backend Lumina

Backend unificado que integra **microservicios-basico** y **foro-estudiantes**.

## Arquitectura

```
Frontend (puerto 5173)
       │
       ▼
foro-estudiantes (4300)  ◄── Punto de entrada (auth, content, users, chatbot)
       │
       ├── Base de datos MySQL (redsocial)
       │
       └── microservicios-basico (4200)  ◄── Capa de microservicios
              ├── api-gateway (4200)
              ├── usuarios (4201)
              ├── cursos (4202)
              ├── temas (4203)
              ├── comentarios (4204)
              └── chatbot (4205)
```

## Ejecución

### Opción 1: Todo junto (recomendado)

Desde la raíz del proyecto:

```bash
npm run dev
```

Esto levanta microservicios + foro-estudiantes + frontend.

### Opción 2: Solo backend

```bash
cd backend
npm run dev
```

Levanta microservicios y foro-estudiantes (6 + 1 procesos).

### Opción 3: Por separado

**Terminal 1 - Microservicios:**
```bash
cd backend
npm run dev:microservicios
```

**Terminal 2 - Foro (conectado a microservicios):**
```bash
cd backend
npm run dev:foro:integrado
```

### Opción 4: Solo foro (sin microservicios)

```bash
cd backend
npm run dev:foro
```

## Verificación

- **Gateway:** http://localhost:4200/health
- **Foro:** http://localhost:4300/health → debe mostrar `"microservicios": true` cuando está integrado
- **Base de datos:** crear `.env` en `foro-estudiantes/` con `DB_NAME=redsocial`

## Instalación inicial

```bash
cd backend
npm run install:all
```
