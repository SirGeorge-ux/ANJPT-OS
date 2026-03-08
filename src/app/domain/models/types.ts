// 1. Definimos los roles exactos que acordamos
export enum UserRole {
  Admin = 'ADMIN',
  Maintainer = 'MAINTAINER',
  Senior = 'SENIOR',
  Junior = 'JUNIOR'
}

// 2. Definimos los estados exactos de la Regla de Oro
export enum TaskStatus {
  ToDo = 'TO_DO',
  InProgress = 'IN_PROGRESS',
  InReview = 'IN_REVIEW',
  Done = 'DONE'
}

// 3. Definimos la estructura exacta de una Tarea
 export interface Task {
    id: string;
    title: string; // titulo de la tarea
    description: string; //descripcion de la tarea
    status: TaskStatus; // estado de la tarea, solo podria ser To Do, In Progress, In Review y Done";
    difficulty: number; // Nivel de dificultad que podria ir de 1 al 3 o del 1 al 5
    assigneeId: string; // El ID del User, solo podria ser Senior y el administrador en su defecto
    reviewerId: string; // El ID del User, solo podria ser Junior
    revision_count: number;
    comments: string[]; // Comentarios de la tarea, solo el master y el junior pueden comentar
 } 

 export interface ComentarioTarea {
  id?: string;
  tarea_id: string;
  usuario_id: string;
  contenido: string;
  creado_en?: string;
  editado_en?: string | null;
  // Relación con Supabase para traer los datos del autor
  perfiles?: { 
    nombre: string;
    rol: string;
  };
  }
 
 export interface User {
    id: string;
    name: string;
    role: UserRole;
 }