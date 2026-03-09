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
  id?: string;
  proyecto_id?: string;
  asignado_a?: string;
  
  // 🚀 VARIABLES BÁSICAS (Las que te pedía el HTML)
  titulo?: string;
  descripcion?: string;
  estado?: string;
  
  // ⏱️ MOTORES TEMPORALES (Para el Gantt)
  fecha_inicio?: string; 
  fecha_fin?: string;    
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

 export interface Proyecto {
  id?: string;
  nombre: string;
  descripcion: string;
  estado?: string;
  creado_por: string;
  creado_en?: string;
  
  // Variables gráficas de lista
  tareasPendientes?: number;
  progreso?: number;
  
  // 🚀 VARIABLES NUEVAS PARA EL DETALLE (Las que te pedía el HTML)
  wiki?: string;
  lider?: string;
  colaboradores?: string[];
  mantenedor?: string;
  stack?: string[];
  
  perfiles?: {
    nombre: string;
    rol: string;
  };
}
