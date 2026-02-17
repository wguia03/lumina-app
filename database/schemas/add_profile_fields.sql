-- Migración: Agregar avatar y nickname al perfil
-- Ejecutar en MySQL Workbench
-- Si da error "Duplicate column", las columnas ya existen

USE redsocial;

ALTER TABLE users 
ADD COLUMN avatar_url LONGTEXT,
ADD COLUMN nickname VARCHAR(50);

SELECT 'Migración completada: avatar_url y nickname agregados' AS mensaje;
