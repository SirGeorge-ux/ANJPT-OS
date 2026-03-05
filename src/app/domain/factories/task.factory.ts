import { Task, TaskStatus } from '../models/types';

// Los datos estrictamente necesarios que pediremos al usuario al crear la tarea
export interface CreateTaskDTO {
  title: string;
  description: string;
  difficulty: number;
  assigneeId: string;
  reviewerId: string;
}

export class TaskFactory {
  
  static create(data: CreateTaskDTO): Task {
    return {
      // 1. Asignamos los datos que ya vienen del usuario
      title: data.title,
      description: data.description,
      difficulty: data.difficulty,
      assigneeId: data.assigneeId,
      reviewerId: data.reviewerId,

      // 2. Valores técnicos autogenerados por la fábrica
      id: crypto.randomUUID(), // Aquí podrías usar una librería como uuid para generar un ID único
      status: TaskStatus.ToDo, // El estado inicial de la Regla de Oro
      revision_count: 0, // El contador inicial
      comments: [] // Inicia vacío por defecto
    };
  }
}