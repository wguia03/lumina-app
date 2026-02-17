-- Migración SIMPLE: Para cuando NO HAY VOTOS PREVIOS
-- Solo ejecuta este script si estás seguro de que la tabla votes está vacía
-- o no te importa perder los votos existentes

USE redsocial;

-- Eliminar y recrear tabla votes con nueva estructura
DROP TABLE IF EXISTS votes;

CREATE TABLE votes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  publication_id INT NOT NULL,
  reaction_type ENUM('like', 'love', 'insightful', 'support', 'thinking') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (publication_id) REFERENCES publications(id) ON DELETE CASCADE,
  UNIQUE KEY unique_vote (user_id, publication_id),
  INDEX idx_publication (publication_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Migración simple completada: Tabla votes recreada' AS mensaje;
