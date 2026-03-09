import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TareasService {
  private authService = inject(AuthService);
  private supabase = this.authService.supabase; 

  // OBTENER COMENTARIOS
  async getComentariosDeTarea(tareaId: string) {
    const { data, error } = await this.supabase
      .from('comentarios_tareas')
      .select(`*, perfiles ( nombre, rol )`)
      .eq('tarea_id', tareaId)
      .order('creado_en', { ascending: true });

    if (error) throw error;
    return data;
  }

  // ENVIAR COMENTARIO
  async addComentario(tareaId: string, usuarioId: string, contenido: string) {
    const { data, error } = await this.supabase
      .from('comentarios_tareas')
      .insert([{ tarea_id: tareaId, usuario_id: usuarioId, contenido: contenido }])
      .select();

    if (error) throw error;
    return data;
  }

  // ACTUALIZAR ESTADO (NUEVO)
  async updateEstadoTarea(tareaId: string, nuevoEstado: string) {
    const { error } = await this.supabase
      .from('tareas')
      .update({ estado: nuevoEstado })
      .eq('id', tareaId);

    if (error) throw error;
  }
  // 📥 OBTENER TAREAS DE UN PROYECTO (Para el Backlog y el Gantt)
  async getTareasPorProyecto(proyectoId: string) {
    const { data, error } = await this.supabase
      .from('tareas')
      .select('*')
      .eq('proyecto_id', proyectoId)
      .order('fecha_inicio', { ascending: true }); // Ordenamos cronológicamente

    if (error) throw error;
    return data;
  }

  // 📤 CREAR TAREA TEMPORAL EN UN PROYECTO
  async addTareaAProyecto(tarea: any) {
    const { data, error } = await this.supabase
      .from('tareas')
      .insert([tarea])
      .select();

    if (error) throw error;
    return data;
  }
}