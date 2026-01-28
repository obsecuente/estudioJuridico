-- Script para actualizar la columna fecha_limite de DATEONLY a DATETIME
-- Esto permitirá guardar la hora además de la fecha

-- Para MySQL/MariaDB:
ALTER TABLE vencimientos 
MODIFY COLUMN fecha_limite DATETIME NOT NULL;

-- Si ya tienes datos y quieres mantenerlos, primero haz un backup:
-- CREATE TABLE vencimientos_backup AS SELECT * FROM vencimientos;
