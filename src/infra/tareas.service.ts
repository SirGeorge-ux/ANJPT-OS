import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service'; // Importamos el servicio central

@Injectable({
  providedIn: 'root'
})
export class TareasService {
  // 1. Inyectamos el servicio de Autenticación
  private authService = inject(AuthService);
  
  // 2. Tomamos prestado su motor de Supabase ya iniciado (Sin hacer createClient)
  private supabase = this.authService.supabase; 

  // ==========================================
  // 📥 OBTENER TODOS LOS COMENTARIOS DE UNA TAREA
  // ==========================================
  async getComentariosDeTarea(tareaId: string) {
    const { data, error } = await this.supabase
      .from('comentarios_tareas')
      .select(`
        *,
        perfiles ( nombre, rol )
      `)
      .eq('tarea_id', tareaId)
      .order('creado_en', { ascending: true });

    if (error) throw error;
    return data;
  }

  // ==========================================
  // 📤 ENVIAR UN NUEVO COMENTARIO
  // ==========================================
  async addComentario(tareaId: string, usuarioId: string, contenido: string) {
    const { data, error } = await this.supabase
      .from('comentarios_tareas')
      .insert([
        { 
          tarea_id: tareaId, 
          usuario_id: usuarioId, 
          contenido: contenido 
        }
      ])
      .select();

    if (error) throw error;
    return data;
  }
}