# Guía de Ejecución - Lumina

Pasos detallados para configurar y ejecutar el proyecto Lumina en un entorno local.

---

## Requisitos Previos

| Software | Versión mínima | Descarga |
|----------|----------------|----------|
| **Node.js** | 18.0.0 o superior | https://nodejs.org |
| **npm** | 9.0.0 o superior | Incluido con Node.js |
| **MySQL** | 8.0 o superior | https://dev.mysql.com/downloads/ |
| **Git** | Cualquiera | https://git-scm.com |

---

## Paso 1: Crear la Base de Datos

### Opción A: MySQL Workbench

1. Abre MySQL Workbench y conéctate al servidor local
2. Abre el archivo `database/schemas/redsocial_schema.sql`
3. Ejecuta todo el script (Ctrl+Shift+Enter)

### Opción B: Terminal

```bash
mysql -u root -p < database/schemas/redsocial_schema.sql
```

### Opción C: npm

```bash
npm run db:init:redsocial
```

### Verificación

```sql
SHOW DATABASES;
USE redsocial;
SHOW TABLES;
-- Debe mostrar: usuarios, cursos, inscripciones, publicaciones, comentarios, etc.
```

---

## Paso 2: Configurar Variables de Entorno

Copia los archivos de ejemplo y ajusta las credenciales:

**Backend (foro-estudiantes):**
```bash
cp backend/foro-estudiantes/.env.example backend/foro-estudiantes/.env
```

Edita `backend/foro-estudiantes/.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=redsocial
```

**Frontend:**
```bash
cp frontend/.env.example frontend/.env
```

Edita `frontend/.env`:
```env
VITE_API_URL=http://localhost:4300
VITE_WS_URL=ws://localhost:4300
```

---

## Paso 3: Instalar Dependencias

```bash
npm run install:all
```

O por partes:
```bash
npm run install:backend
npm run install:frontend
```

---

## Paso 4: Iniciar el Proyecto

```bash
npm run dev
```

Esto levanta:
- **Microservicios** (gateway 4200, usuarios, cursos, temas, comentarios, chatbot)
- **Foro-estudiantes** (puerto 4300): auth, BD MySQL, contenido
- **Frontend** (puerto 3000): React + Vite

### URLs

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Foro (API auth, content) | http://localhost:4300 |
| API Gateway | http://localhost:4200 |

---

## Paso 5: Verificar

1. Abre http://localhost:3000
2. Regístrate con un nuevo usuario
3. Inicia sesión
4. Navega por el feed y los cursos

---

## Detener el Proyecto

Presiona `Ctrl + C` en el terminal donde está corriendo.

---

## Solución de Problemas

### Error: Puerto en uso

```powershell
netstat -ano | findstr :4300
taskkill /PID <numero_pid> /F
```

### Error: No se puede conectar a la base de datos

1. Verifica que MySQL está corriendo
2. Comprueba las credenciales en `backend/foro-estudiantes/.env`
3. Verifica que la base de datos `redsocial` existe

### El registro no guarda usuarios en la BD

1. Asegúrate de que `DB_NAME=redsocial` está en `backend/foro-estudiantes/.env`
2. Verifica que foro-estudiantes está corriendo (puerto 4300)
3. En Postman: `POST http://localhost:4300/api/auth/register`

### Error: Cannot find module

```bash
npm run install:all
```

---

## Resumen de Comandos

| Paso | Comando |
|------|---------|
| Crear BD | `npm run db:init:redsocial` |
| Instalar | `npm run install:all` |
| Iniciar | `npm run dev` |
| Detener | `Ctrl + C` |
