-- Datos de ejemplo para desarrollo y pruebas
USE redsocial;

-- Insertar cursos de ejemplo
INSERT INTO courses (name, code, description, university) VALUES
('Programación I', 'CS101', 'Introducción a la programación con Python', 'Universidad Nacional'),
('Base de Datos', 'CS201', 'Diseño y gestión de bases de datos relacionales', 'Universidad Nacional'),
('Estructuras de Datos', 'CS102', 'Algoritmos y estructuras de datos fundamentales', 'Universidad Nacional'),
('Desarrollo Web', 'CS301', 'Desarrollo de aplicaciones web modernas', 'Universidad Nacional'),
('Inteligencia Artificial', 'CS401', 'Fundamentos de IA y Machine Learning', 'Universidad Nacional');

-- Insertar logros de ejemplo
INSERT INTO achievements (name, description, icon, points_required) VALUES
('Primera Publicación', 'Crea tu primera publicación', '📝', 10),
('Colaborador Activo', 'Realiza 10 comentarios', '💬', 50),
('Experto en Apuntes', 'Crea 5 apuntes colaborativos', '📚', 75),
('Mentor', 'Recibe 50 votos positivos', '⭐', 100),
('Gurú del Conocimiento', 'Alcanza 1000 puntos de reputación', '🏆', 1000);

-- Nota: Los usuarios se crearán a través del proceso de registro
-- Los datos reales se generarán cuando los usuarios usen la aplicación
