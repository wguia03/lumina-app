# Base de Datos - Red Social de Aprendizaje Colaborativo

## Descripción

Base de datos MySQL que almacena toda la información de la plataforma: usuarios, contenidos, reputación, conversaciones del chatbot y más.

## Estructura

### Tablas Principales

#### Usuarios y Autenticación
- **users**: Información de usuarios (perfil, credenciales)
- **user_courses**: Relación de usuarios con cursos inscritos

#### Contenidos
- **publications**: Publicaciones en el feed
- **comments**: Comentarios en publicaciones
- **votes**: Votos (up/down) en publicaciones
- **notes**: Apuntes colaborativos
- **note_edits**: Historial de ediciones de apuntes
- **note_versions**: Versiones completas de apuntes

#### Académico
- **courses**: Cursos disponibles

#### Reputación y Gamificación
- **reputation**: Puntos, nivel y ranking de usuarios
- **achievements**: Logros disponibles
- **user_achievements**: Logros desbloqueados por usuarios

#### Chatbot
- **conversations**: Conversaciones con el chatbot
- **conversation_messages**: Mensajes de las conversaciones

#### Otros
- **notifications**: Notificaciones del sistema

### Vistas

- **publications_with_stats**: Publicaciones con estadísticas de votos y comentarios
- **user_ranking**: Ranking global de usuarios por reputación

## Instalación

### 1. Crear la base de datos

```bash
mysql -u root -p < schemas/init.sql
```

### 2. Cargar datos de ejemplo (opcional)

```bash
mysql -u root -p < seeds/sample_data.sql
```

### 3. Configurar servicios

Asegúrate de configurar las credenciales de MySQL en los archivos `.env` de cada microservicio:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=red_social_aprendizaje
```

## Modelo de Datos

### Relaciones Principales

```
users
  ├── 1:N → publications
  ├── 1:N → comments
  ├── 1:N → votes
  ├── 1:N → notes
  ├── 1:1 → reputation
  └── 1:N → conversations

courses
  ├── N:M → users (through user_courses)
  ├── 1:N → publications
  └── 1:N → notes

publications
  ├── 1:N → comments
  └── 1:N → votes

notes
  ├── 1:N → note_edits
  └── 1:N → note_versions

conversations
  └── 1:N → conversation_messages
```

## Índices y Optimización

La base de datos incluye índices en:
- Claves foráneas
- Campos de búsqueda frecuente (email, created_at, etc.)
- Campos de ordenamiento (points, rank)
- Índices FULLTEXT para búsqueda de contenido

## Respaldos

### Crear respaldo

```bash
mysqldump -u root -p red_social_aprendizaje > backup_$(date +%Y%m%d).sql
```

### Restaurar respaldo

```bash
mysql -u root -p red_social_aprendizaje < backup_20240101.sql
```

## Migraciones

Para futuras actualizaciones del esquema, crear archivos numerados en `migrations/`:

- `001_add_feature_x.sql`
- `002_modify_table_y.sql`
- etc.

## Seguridad

- Las contraseñas se almacenan con bcrypt (nunca en texto plano)
- Usa siempre prepared statements para prevenir SQL injection
- Limita los permisos del usuario de base de datos según el servicio
- Realiza respaldos regulares

## Mantenimiento

### Optimizar tablas

```sql
OPTIMIZE TABLE publications, comments, notes;
```

### Ver estadísticas

```sql
-- Usuarios totales
SELECT COUNT(*) FROM users;

-- Publicaciones por curso
SELECT c.name, COUNT(p.id) as total
FROM courses c
LEFT JOIN publications p ON c.id = p.course_id
GROUP BY c.id;

-- Top usuarios por reputación
SELECT * FROM user_ranking LIMIT 10;
```

## Notas

- Motor InnoDB para soporte de transacciones
- Charset utf8mb4 para soporte completo de Unicode (incluyendo emojis)
- Foreign keys con CASCADE para mantener integridad referencial
