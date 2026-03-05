-- 1. Primero construimos las bases (users no depende de nadie)
CREATE TABLE users (  
    id UUID PRIMARY KEY,  
    created_at TIMESTAMP DEFAULT NOW(),
    name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    address VARCHAR(255),
    city VARCHAR(255),
    country VARCHAR(255),
    phone VARCHAR(50),
    dni VARCHAR(255),
    role VARCHAR(50),
    team VARCHAR(50),
    alias VARCHAR(255),
    avatar VARCHAR(255),
    status VARCHAR(50),
    last_login TIMESTAMP DEFAULT NOW()
);

-- 2. Luego construimos las tareas (porque necesitan referenciar a los users)
CREATE TABLE tasks (  
    id UUID PRIMARY KEY,  
    title VARCHAR(255) NOT NULL,  
    description TEXT,  
    status VARCHAR(50),  
    difficulty INT,  
    assignee_id UUID REFERENCES users(id),  
    reviewer_id UUID REFERENCES users(id),  
    revision_count INT DEFAULT 0,  
    comments TEXT[], 
    fecha_registro TIMESTAMP DEFAULT NOW() 
);

-- 3. Activamos la seguridad RLS en las tablas recién creadas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 4. Creamos las políticas de acceso para las tareas
CREATE POLICY "juniors_update_tasks" 
ON tasks FOR UPDATE USING (auth.uid() = assignee_id);

CREATE POLICY "seniors_update_tasks" 
ON tasks FOR UPDATE USING (auth.uid() = reviewer_id);

-- 5. Definimos la regla de negocio estricta en una función
CREATE OR REPLACE FUNCTION check_task_done_rule()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'DONE' AND auth.uid() != NEW.reviewer_id THEN
    RAISE EXCEPTION 'Acceso denegado: Solo el Senior asignado puede finalizar la tarea.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Activamos el disparador (Trigger)
CREATE TRIGGER enforce_done_rule
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION check_task_done_rule();