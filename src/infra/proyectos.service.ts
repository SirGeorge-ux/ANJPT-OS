import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProyectosService {
  private authService = inject(AuthService);
  // Reutilizamos la conexión pública que ya tienes en auth.service.ts
  private supabase = this.authService.supabase;

  // 📥 Descargar todos los proyectos
  async getProyectos() {
    const { data, error } = await this.supabase
      .from('proyectos')
      .select(`*, perfiles ( nombre, rol )`)
      .order('creado_en', { ascending: false });

    if (error) throw error;
    return data;
  }

  // 📤 Crear un proyecto nuevo (Para cualquier miembro)
  async addProyecto(nombre: string, descripcion: string, creadorId: string) {
    const { data, error } = await this.supabase
      .from('proyectos')
      .insert([{ nombre, descripcion, creado_por: creadorId }])
      .select();

    if (error) throw error;
    return data;
  }
  // ==========================================
  // 🔄 ALTERAR ESTADO DEL PROYECTO
  // ==========================================
  async updateEstadoProyecto(proyectoId: string, nuevoEstado: string) {
    const { error } = await this.supabase
      .from('proyectos')
      .update({ estado: nuevoEstado })
      .eq('id', proyectoId);

    if (error) throw error;
  }

  // ==========================================
  // 🗑️ DEMOLER PROYECTO (Solo ADMIN)
  // ==========================================
  async deleteProyecto(proyectoId: string) {
    const { error } = await this.supabase
      .from('proyectos')
      .delete()
      .eq('id', proyectoId);

    if (error) throw error;
  }
}