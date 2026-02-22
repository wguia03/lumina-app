# Foro Estudiantes - Red Social Universitaria

Backend para red social universitaria donde estudiantes comparten y resuelven temas por curso.

## Servicios

- **usuarios** - perfil, carrera, universidad, seguidores/seguidos
- **cursos** - materias con inscripciones de estudiantes
- **temas** - publicaciones con tags, estado (abierto/resuelto), vistas
- **comentarios** - respuestas anidadas, marcar como solucion
- **reacciones** - like, love, apoyo, genial, interesante (a temas y comentarios)
- **sugerencias** - temas populares, cursos activos, usuarios destacados, para ti

## Ejecutar

```bash
npm install
npm run dev
```

Puerto: `4300`

## Endpoints

### Usuarios
- `GET    /api/usuarios` - listar todos
- `GET    /api/usuarios/:id` - perfil con stats
- `POST   /api/usuarios` - crear (nombre, email, carrera, universidad, bio)
- `PUT    /api/usuarios/:id` - editar perfil
- `DELETE /api/usuarios/:id` - eliminar
- `POST   /api/usuarios/:id/seguir` - seguir usuario (body: seguidorId)
- `DELETE /api/usuarios/:id/seguir` - dejar de seguir (body: seguidorId)
- `GET    /api/usuarios/:id/seguidores` - ver seguidores
- `GET    /api/usuarios/:id/seguidos` - ver seguidos

### Cursos
- `GET    /api/cursos` - listar todos
- `GET    /api/cursos/:id` - detalle con stats
- `POST   /api/cursos` - crear (nombre, codigo, descripcion, docente)
- `PUT    /api/cursos/:id` - editar
- `DELETE /api/cursos/:id` - eliminar
- `POST   /api/cursos/:id/inscribir` - inscribirse (body: usuarioId)
- `DELETE /api/cursos/:id/inscribir` - desinscribirse (body: usuarioId)
- `GET    /api/cursos/:id/inscritos` - listar inscritos

### Temas
- `GET    /api/temas` - listar (filtros: cursoId, usuarioId, estado, q)
- `GET    /api/temas/:id` - detalle (suma vista)
- `POST   /api/temas` - crear (titulo, contenido, cursoId, usuarioId, tags)
- `PUT    /api/temas/:id` - editar (titulo, contenido, tags, estado)
- `PATCH  /api/temas/:id/resolver` - marcar como resuelto
- `DELETE /api/temas/:id` - eliminar

### Comentarios
- `GET    /api/comentarios` - listar (filtro: temaId)
- `GET    /api/comentarios/:id` - detalle
- `POST   /api/comentarios` - crear (contenido, temaId, usuarioId, parentId)
- `PUT    /api/comentarios/:id` - editar contenido
- `PATCH  /api/comentarios/:id/solucion` - marcar como solucion del tema
- `DELETE /api/comentarios/:id` - eliminar

### Reacciones
- `POST   /api/reacciones` - reaccionar (tipo, targetTipo, targetId, usuarioId)
  - tipos: like, love, apoyo, genial, interesante
  - targetTipo: tema o comentario
  - Si ya reaccionaste con el mismo tipo: se elimina (toggle)
  - Si ya reaccionaste con otro tipo: se actualiza
- `GET    /api/reacciones/:targetTipo/:targetId` - ver reacciones con resumen

### Sugerencias
- `GET    /api/sugerencias/temas-populares` - top 10 temas por score
- `GET    /api/sugerencias/cursos-activos` - top 10 cursos por actividad
- `GET    /api/sugerencias/usuarios-destacados` - top 10 usuarios por aportes
- `GET    /api/sugerencias/para-ti/:usuarioId` - temas recomendados + quien seguir

## Flujo tipico

1. Crear usuario con perfil (carrera, universidad)
2. Crear curso e inscribirse
3. Publicar tema con tags en un curso
4. Otros comentan y reaccionan
5. Marcar mejor comentario como solucion
6. Seguir usuarios que aportan
7. Ver sugerencias personalizadas
