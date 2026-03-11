import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Activity, Clock, Code, AlertTriangle, Flame } from 'lucide-angular';

// 🔥 IMPORTANTE: Verifica que esta ruta apunta correctamente a tu AuthService
import { AuthService } from '../../../infra/auth.service';

@Component({
  selector: 'app-metricas',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './metricas.component.html',
  styleUrls: ['./metricas.component.css']
})
export class MetricasComponent implements OnInit { // 🔥 AÑADIDO OnInit
  
  // 🔥 INYECCIÓN DEL SERVICIO DE AUTENTICACIÓN (Esto soluciona tus errores)
  public readonly authService = inject(AuthService);

  // --- ICONOS ---
  public IconBuscar = Search;
  public IconActividad = Activity;
  public IconReloj = Clock;
  public IconCodigo = Code;
  public IconAlerta = AlertTriangle;
  public IconRacha = Flame;

  // --- VARIABLES DE ESTADO ---
  public cargando: boolean = false;
  public rolUsuario: string = 'JUNIOR';
  public miIdUsuario: string = '';
  public usuarioSeleccionadoId: string = '';
  public listaUsuarios: any[] = [];

  // --- EL OBJETO DE MÉTRICAS ---
  public metricasUsuario = {
    nombre: 'Cargando...',
    nivel: 1,
    rachaDias: 0,
    tasaExito: 0,
    velocidadMedia: 0,
    tareasCompletadas: 0,
    anchoBanda: 0,
    ultimaConexion: 'Desconocida',
    tareasCaducadas: 0,
    evaluacionSistema: 'Analizando...',
    lenguajes: [
      { nombre: 'Angular 19', porcentaje: 65 },
      { nombre: 'Supabase', porcentaje: 40 },
      { nombre: 'TypeScript', porcentaje: 85 }
    ]
  };

  async ngOnInit(): Promise<void> {
    const { data: { session } } = await this.authService.getSession();
    
    if (session) {
      this.rolUsuario = session.user.user_metadata?.['rol'] || 'JUNIOR';
      this.miIdUsuario = session.user.id;
      this.usuarioSeleccionadoId = this.miIdUsuario;
      this.metricasUsuario.nombre = session.user.user_metadata?.['nombre'] || 'Operario Local';
      this.metricasUsuario.nivel = session.user.user_metadata?.['nivel'] || 1;
    }

    if (this.rolUsuario === 'ADMIN') {
      await this.cargarListaUsuarios();
    }

    await this.cargarDatosAuditoria(this.usuarioSeleccionadoId);
  }

  async cargarListaUsuarios() {
    const { data, error } = await this.authService.supabase
      .from('perfiles')
      .select('id, nombre, rol');
      
    if (!error && data) {
      this.listaUsuarios = data;
    }
  }

  async cambiarUsuarioAuditado() {
    if (this.usuarioSeleccionadoId) {
      await this.cargarDatosAuditoria(this.usuarioSeleccionadoId);
    }
  }

  async cargarDatosAuditoria(userId: string) {
    this.cargando = true;
    try {
      const { data: perfilData, error: perfilError } = await this.authService.supabase
        .from('perfiles')
        .select('nombre, rol, ultimo_acceso')
        .eq('id', userId)
        .maybeSingle();
        
      if (perfilError) console.warn('Aviso al cargar perfil:', perfilError);

      const { data: tareasData, error: tareasError } = await this.authService.supabase
        .from('tareas')
        .select('id, estado')
        .eq('asignado_a', userId);
        
      if (tareasError) console.warn('Aviso al cargar tareas:', tareasError);

      const tareas = tareasData || [];
      
      const tareasCompletadas = tareas.filter(t => t.estado === 'Terminado').length;
      const tareasEnProgreso = tareas.filter(t => t.estado === 'En progreso').length;
      const totalTareas = tareas.length;
      const tasaExito = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;

      this.metricasUsuario = {
        nombre: perfilData?.nombre || this.obtenerNombrePorId(userId),
        nivel: perfilData?.rol === 'SENIOR' ? 2 : (perfilData?.rol === 'ADMIN' ? 3 : 1),
        tasaExito: tasaExito,
        velocidadMedia: 2.5, 
        tareasCompletadas: tareasCompletadas,
        anchoBanda: tareasEnProgreso,
        rachaDias: this.calcularRachaAleatoria(),
        lenguajes: [
          { nombre: 'Angular 19', porcentaje: 65 },
          { nombre: 'Supabase', porcentaje: 40 },
          { nombre: 'TypeScript', porcentaje: 85 }
        ],
        ultimaConexion: perfilData?.ultimo_acceso ? new Date(perfilData.ultimo_acceso).toLocaleDateString() : 'Desconocida',
        tareasCaducadas: 0,
        evaluacionSistema: this.generarEvaluacionAutomatica(tasaExito, tareasEnProgreso)
      };
    } catch (error) {
      console.error('Error crítico:', error);
      alert('Se perdió la conexión con la base de datos central.');
    } finally {
      this.cargando = false;
    }
  }

  private generarEvaluacionAutomatica(exito: number, enProgreso: number): string {
    if (exito < 50 && exito > 0) return 'ADVERTENCIA: Bajo rendimiento detectado. Tasa de finalización crítica.';
    if (enProgreso > 5) return 'ALERTA: Posible saturación. El operario tiene demasiadas tareas simultáneas.';
    if (exito >= 80) return 'RENDIMIENTO ÓPTIMO: Operario eficiente. Capacidad para asumir más carga de proyectos.';
    return 'ESTADO NEUTRAL: Operario en parámetros normales de trabajo.';
  }

  private calcularRachaAleatoria(): number {
    return Math.floor(Math.random() * 15) + 1;
  }

  private obtenerNombrePorId(id: string): string {
    if (id === this.miIdUsuario) return 'Mi Perfil (Tú)';
    const user = this.listaUsuarios.find(u => u.id === id);
    return user ? user.nombre : 'Operario Desconocido';
  }
}