# Guía de Despliegue en Producción

Esta guía te ayudará a desplegar la aplicación en entornos de producción.

## Opciones de Despliegue

### Opción 1: Despliegue con Docker (Recomendado)

#### Servicios Requeridos

1. **VPS o Cloud Provider** (DigitalOcean, AWS EC2, Google Cloud, etc.)
2. **Docker y Docker Compose** instalados
3. **Dominio** (opcional pero recomendado)

#### Pasos

##### 1. Preparar Servidor

```bash
# Conectar al servidor
ssh user@your-server-ip

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

##### 2. Clonar Repositorio

```bash
git clone <repository-url>
cd RedSocialAprendizajeColaborativoInteligente
```

##### 3. Configurar Variables de Entorno

```bash
cp .env.example .env
nano .env
```

Configurar valores de producción:

```env
# Base de Datos
DB_PASSWORD=secure-password-here

# JWT
JWT_SECRET=very-secure-random-string-here-at-least-32-chars

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# URLs (con tu dominio)
API_GATEWAY_URL=https://api.tudominio.com
FRONTEND_URL=https://tudominio.com
```

##### 4. Configurar docker-compose para Producción

Crear `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  mysql:
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}

  api-gateway:
    restart: always
    environment:
      - NODE_ENV=production

  # ... (agregar restart y env para todos los servicios)

  frontend:
    restart: always
    environment:
      - NODE_ENV=production
      - VITE_API_URL=https://api.tudominio.com
```

##### 5. Iniciar Servicios

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

##### 6. Configurar Nginx como Reverse Proxy

```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/red-social
```

```nginx
# Frontend
server {
    listen 80;
    server_name tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# API Gateway
server {
    listen 80;
    server_name api.tudominio.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/red-social /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

##### 7. Configurar SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d api.tudominio.com
```

##### 8. Configurar Firewall

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Opción 2: Despliegue en Plataformas Cloud

#### Frontend en Vercel

1. Conecta tu repositorio a Vercel
2. Configura variables de entorno:
   ```
   VITE_API_URL=https://api.tudominio.com
   VITE_WS_URL=wss://api.tudominio.com
   ```
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy

#### Backend en Railway

1. **Crear Proyecto en Railway**
2. **Agregar MySQL Database**
3. **Desplegar cada Microservicio**:
   - Conecta repositorio
   - Selecciona carpeta del servicio
   - Configura variables de entorno
   - Deploy

Variables de entorno para cada servicio:

```env
PORT=4001 # (cambiar según servicio)
DB_HOST=${MYSQL_HOST}
DB_USER=${MYSQL_USER}
DB_PASSWORD=${MYSQL_PASSWORD}
DB_NAME=${MYSQL_DATABASE}
JWT_SECRET=your-secret-here
```

4. **Configurar API Gateway** con URLs de servicios desplegados

#### Backend en Render

Similar a Railway:

1. Crear Web Service para cada microservicio
2. Configurar variables de entorno
3. Deploy

### Opción 3: AWS/GCP/Azure

#### Arquitectura Recomendada

- **Frontend**: S3 + CloudFront (AWS) o Cloud Storage + CDN (GCP)
- **Backend**: ECS/EKS (AWS), Cloud Run (GCP), o Container Apps (Azure)
- **Base de Datos**: RDS (AWS), Cloud SQL (GCP), o Azure Database
- **Load Balancer**: ALB (AWS), Cloud Load Balancing (GCP)

## Checklist de Pre-Despliegue

### Seguridad

- [ ] Cambiar todas las contraseñas y secrets por defecto
- [ ] Configurar JWT_SECRET único y seguro (mínimo 32 caracteres)
- [ ] Habilitar HTTPS/SSL
- [ ] Configurar CORS correctamente
- [ ] Configurar rate limiting
- [ ] Actualizar credenciales de base de datos
- [ ] Configurar backups automáticos de base de datos

### Base de Datos

- [ ] Ejecutar scripts de inicialización
- [ ] Configurar backups automáticos
- [ ] Optimizar índices
- [ ] Configurar replicación (opcional)

### Aplicación

- [ ] Probar todas las funcionalidades
- [ ] Verificar logs y manejo de errores
- [ ] Configurar monitoreo
- [ ] Preparar plan de rollback

### Performance

- [ ] Optimizar imágenes
- [ ] Habilitar compresión (gzip)
- [ ] Configurar CDN para assets estáticos
- [ ] Implementar caching (Redis recomendado)

## Monitoreo y Mantenimiento

### Logs

```bash
# Ver logs de Docker
docker-compose logs -f

# Ver logs específicos
docker-compose logs -f api-gateway
docker-compose logs -f auth-service
```

### Backups de Base de Datos

#### Backup Manual

```bash
docker exec red_social_mysql mysqldump -u root -p red_social_aprendizaje > backup_$(date +%Y%m%d).sql
```

#### Backup Automático (crontab)

```bash
crontab -e
```

Agregar:

```cron
0 2 * * * cd /path/to/project && docker exec red_social_mysql mysqldump -u root -p${DB_PASSWORD} red_social_aprendizaje > backups/backup_$(date +\%Y\%m\%d).sql
```

### Actualizaciones

```bash
# Pull últimos cambios
git pull origin main

# Rebuild y restart servicios
docker-compose down
docker-compose build
docker-compose up -d
```

### Scaling

#### Escalar Servicio Específico

```bash
docker-compose up --scale content-service=3 -d
```

#### Con Kubernetes (Avanzado)

```bash
kubectl scale deployment content-service --replicas=3
```

## Troubleshooting

### Servicios No Inician

```bash
# Verificar logs
docker-compose logs

# Verificar estado
docker-compose ps

# Restart servicios
docker-compose restart
```

### Error de Conexión a Base de Datos

1. Verificar que MySQL esté ejecutándose
2. Verificar credenciales en variables de entorno
3. Verificar que la red Docker esté correcta

```bash
docker network ls
docker network inspect red_social_network
```

### Performance Lenta

1. Verificar uso de recursos:
```bash
docker stats
```

2. Optimizar queries de base de datos
3. Implementar caching
4. Escalar servicios problemáticos

### Disk Space

```bash
# Ver uso de disco
df -h

# Limpiar imágenes Docker no usadas
docker system prune -a
```

## Rollback

En caso de problemas con una actualización:

```bash
# Revertir a commit anterior
git log --oneline
git checkout <commit-hash>

# Rebuild y restart
docker-compose down
docker-compose build
docker-compose up -d
```

## Mejores Prácticas

1. **Usar CI/CD**: GitHub Actions, GitLab CI, o Jenkins
2. **Monitoreo Continuo**: Prometheus + Grafana o servicios managed
3. **Alertas**: Configurar alertas para caídas de servicios
4. **Documentación**: Mantener documentación actualizada
5. **Pruebas**: Implementar tests automatizados
6. **Backups**: Múltiples copias en diferentes ubicaciones
7. **Staging**: Usar ambiente de staging antes de producción
8. **Versionado**: Tags en Git para releases

## Costos Estimados

### Opción 1: VPS (DigitalOcean/Linode)

- Droplet 4GB RAM: ~$24/mes
- Base de datos managed: ~$15/mes
- **Total**: ~$39/mes

### Opción 2: Railway/Render

- Cada servicio: ~$5-10/mes
- Base de datos: ~$10-15/mes
- **Total**: ~$50-80/mes

### Opción 3: AWS/GCP

Variable según uso, estimado:
- ECS/Cloud Run: ~$30-50/mes
- RDS/Cloud SQL: ~$20-30/mes
- CDN y otros: ~$10-20/mes
- **Total**: ~$60-100/mes

## Soporte

Para problemas específicos de despliegue, consulta:

- [Documentación de Docker](https://docs.docker.com/)
- [Documentación de Nginx](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/docs/)
- [Railway Docs](https://docs.railway.app/)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
