# Guia de Ejecucion - Lumina

Pasos detallados para configurar y ejecutar el proyecto Lumina en un entorno local con Windows.

---

## Requisitos Previos

Antes de comenzar, asegurate de tener instalado:

| Software | Version minima | Descarga |
|----------|---------------|----------|
| **Node.js** | 18.0.0 o superior | https://nodejs.org |
| **npm** | 9.0.0 o superior | Incluido con Node.js |
| **MySQL** | 8.0 o superior | https://dev.mysql.com/downloads/ |
| **Git** | Cualquiera | https://git-scm.com |

Para verificar las versiones instaladas, abre PowerShell y ejecuta:

```powershell
node --version
npm --version
mysql --version
```

---

## Paso 1: Crear la Base de Datos

Abre **MySQL Workbench** o la terminal de MySQL y ejecuta el script de inicializacion.

### Opcion A: Desde MySQL Workbench

1. Abre MySQL Workbench y conectate al servidor local
2. Abre el archivo `database/schemas/init.sql`
3. Ejecuta todo el script (boton de rayo o Ctrl+Shift+Enter)

### Opcion B: Desde la terminal de MySQL

```powershell
cd "D:\RedSocialAprendizajeColaborativoInteligente"
mysql -u root -p < database/schemas/init.sql
```

Ingresa tu contrasena de MySQL cuando se solicite.

### Verificacion

Comprueba que la base de datos se creo correctamente:

```sql
SHOW DATABASES;
-- Debe aparecer 'redsocial'

USE redsocial;
SHOW TABLES;
-- Debe mostrar: users, courses, user_courses, publications, comments, votes,
-- collaborative_notes, note_versions, reputation, recommendations,
-- dm_conversations, dm_messages
```

---

## Paso 2: Configurar Variables de Entorno

Desde la **raiz del proyecto**, ejecuta el script de configuracion en PowerShell:

```powershell
cd "D:\RedSocialAprendizajeColaborativoInteligente"
.\configurar-proyecto.ps1
```

El script te pedira:
- **Contrasena de MySQL**: La contrasena del usuario `root` de tu MySQL
- **OpenAI API Key**: Tu clave de OpenAI (presiona Enter para usar modo demo)

Esto creara archivos `.env` en cada microservicio con la configuracion correcta.

### Verificacion

Comprueba que se generaron los archivos `.env`:

```powershell
Get-ChildItem -Recurse -Filter ".env" | Select-Object FullName
```

Deberian existir archivos `.env` en:
- `backend/auth-service/.env`
- `backend/user-service/.env`
- `backend/content-service/.env`
- `backend/collaboration-service/.env`
- `backend/reputation-service/.env`
- `backend/recommendation-service/.env`
- `backend/chatbot-service/.env`
- `backend/messaging-service/.env`
- `backend/api-gateway/.env`
- `frontend/.env`

---

## Paso 3: Instalar Dependencias

Ejecuta el script de instalacion:

```powershell
.\instalar-dependencias.ps1
```

Este proceso instala las dependencias npm de:
- La raiz del proyecto (herramienta `concurrently`)
- El modulo compartido (`backend/shared`)
- Cada uno de los 8 microservicios del backend
- El frontend (React + Vite)

**Duracion estimada**: 5-10 minutos dependiendo de tu conexion a internet.

---

## Paso 4: Iniciar el Proyecto

### Opcion A: Un solo terminal (Recomendado)

Ejecuta todos los servicios desde un unico terminal con colores:

```powershell
npm run dev
```

Esto usa `concurrently` para levantar los 9 microservicios del backend y el frontend en paralelo. Cada servicio se muestra con un color y prefijo diferente.

### Opcion B: Terminales separadas

Si prefieres ver cada servicio en su propia ventana:

```powershell
.\iniciar-proyecto.ps1
```

### Opcion C: Docker

Si tienes Docker instalado:

```powershell
docker-compose up --build
```

---

## Paso 5: Verificar que todo funciona

Una vez iniciado, los servicios estaran disponibles en:

| Servicio | URL | Estado esperado |
|----------|-----|----------------|
| Frontend | http://localhost:3000 | Pagina de login de Lumina |
| API Gateway | http://localhost:4000 | Proxy activo |
| Auth Service | http://localhost:4001 | Servicio de autenticacion |
| User Service | http://localhost:4002 | Servicio de usuarios |
| Content Service | http://localhost:4003 | Servicio de contenido |
| Collaboration Service | http://localhost:4004 | Servicio de colaboracion |
| Reputation Service | http://localhost:4005 | Servicio de reputacion |
| Recommendation Service | http://localhost:4006 | Servicio de recomendaciones |
| Chatbot Service | http://localhost:4007 | Servicio de chatbot |
| Messaging Service | http://localhost:4008 | Servicio de mensajeria |

### Prueba rapida

1. Abre http://localhost:3000 en tu navegador
2. Registra un nuevo usuario
3. Inicia sesion
4. Crea una publicacion en el feed
5. Prueba las reacciones y el chatbot

---

## Detener el Proyecto

### Si usaste `npm run dev`

Presiona `Ctrl + C` en el terminal donde esta corriendo.

### Si usaste terminales separadas

```powershell
.\detener-proyecto.ps1
```

### Si usaste Docker

```powershell
docker-compose down
```

---

## Solucion de Problemas

### Error: Puerto en uso (EADDRINUSE)

Algun servicio ya esta corriendo en ese puerto. Detenlo primero:

```powershell
.\detener-proyecto.ps1
```

O busca y termina el proceso manualmente:

```powershell
netstat -ano | findstr :4000
taskkill /PID <numero_pid> /F
```

### Error: No se puede conectar a la base de datos

1. Verifica que MySQL esta corriendo
2. Comprueba que la contrasena en los archivos `.env` es correcta
3. Verifica que la base de datos `redsocial` existe

### Error: Cannot find module

Reinstala las dependencias:

```powershell
.\instalar-dependencias.ps1
```

### El frontend no carga

Verifica que el archivo `frontend/.env` tiene:

```
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
```

### El registro de usuario no funciona

Asegurate de que:
1. El **API Gateway** (puerto 4000) esta corriendo
2. El **Auth Service** (puerto 4001) esta corriendo
3. La base de datos `redsocial` tiene la tabla `users`

---

## Resumen de Comandos

| Paso | Comando |
|------|---------|
| Configurar .env | `.\configurar-proyecto.ps1` |
| Instalar dependencias | `.\instalar-dependencias.ps1` |
| Iniciar todo | `npm run dev` |
| Detener todo | `Ctrl + C` o `.\detener-proyecto.ps1` |
| Iniciar con Docker | `docker-compose up --build` |
| Detener Docker | `docker-compose down` |
