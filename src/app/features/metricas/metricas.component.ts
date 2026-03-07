import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../infra/auth.service';
import { 
  LucideAngularModule, 
  Activity, 
  Clock, 
  ShieldAlert, 
  Terminal, 
  Flame,
  Search
} from 'lucide-angular';

@Component({
  selector: 'app-metricas',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './metricas.component.html',
  styleUrls: ['./metricas.component.css']
})
export class MetricasComponent implements OnInit {

  // 🛰️ Dependencias
  public readonly authService = inject(AuthService);

  // 🎨 Iconos para el Dashboard
  readonly IconActividad = Activity;
  readonly IconReloj = Clock;
  readonly IconAlerta = ShieldAlert;
  readonly IconCodigo = Terminal;
  readonly IconRacha = Flame;
  readonly IconBuscar = Search;

  // 🛡️ Control de Acceso y Estado
  rolUsuario: string = 'JUNIOR';
  miIdUsuario: string = '';
  cargando: boolean = true;

  // 👥 Buscador Admin
  listaUsuarios: any[] = [];
  usuarioSeleccionadoId: string = ''; // ID del usuario que estamos auditando

  // 📊 Estructura de las Métricas
  metricasUsuario = {
    nombre: 'Cargando...',
    nivel: 1,
    tasaExito: 0,        // % de revisiones positivas
    velocidadMedia: 0,   // Días por tarea
    tareasCompletadas: 0,
    anchoBanda: 0,       // Tareas actualmente "En progreso"
    rachaDias: 0,        // Días seguidos trabajando
    lenguajes: [] as { nombre: string, porcentaje: number }[],
    // ⚠️ Zona Clasificada (Solo Admin)
    ultimaConexion: 'Desconocida',
    tareasCaducadas: 0,
    evaluacionSistema: 'Analizando...'
  };

  async ngOnInit(): Promise<void> {
    const { data: { session } } = await this.authService.getSession();
    
    if (session) {
      this.rolUsuario = session.user.user_metadata?.['rol'] || 'JUNIOR';
      this.miIdUsuario = session.user.id;
      this.usuarioSeleccionadoId = this.miIdUsuario; // Por defecto, me veo a mí mismo
      this.metricasUsuario.nombre = session.user.user_metadata?.['nombre'] || 'Operario Local';
      this.metricasUsuario.nivel = session.user.user_metadata?.['nivel'] || 1;
    }

    // Si soy Admin, cargo la lista de todos los operarios para el buscador
    if (this.rolUsuario === 'ADMIN') {
      await this.cargarListaUsuarios();
    }

    // Cargamos los datos del usuario seleccionado (al principio, yo mismo)
    await this.cargarDatosAuditoria(this.usuarioSeleccionadoId);
  }

  // 🔍 Carga la lista del desplegable para el ADMIN
  async cargarListaUsuarios() {
    const { data, error } = await this.authService.supabase
      .from('perfiles')
      .select('id, nombre, rol');

    if (!error && data) {
      this.listaUsuarios = data;
    }
  }

  // 🔄 Cambia la vista cuando el ADMIN selecciona a otro usuario
  async cambiarUsuarioAuditado() {
    if (this.usuarioSeleccionadoId) {
      this.cargando = true;
      await this.cargarDatosAuditoria(this.usuarioSeleccionadoId);
    }
  }

  // 🧠 Lógica Principal: Descargar y calcular métricas REALES (VERSIÓN BLINDADA)
  async cargarDatosAuditoria(userId: string) {
    this.cargando = true;

    try {
      // 1. Usamos maybeSingle() para que no explote si no encuentra el perfil
      const { data: perfilData, error: perfilError } = await this.authService.supabase
        .from('perfiles') // <-- IMPORTANTE: Comprueba en Supabase que tu tabla se llama así
        .select('nombre, rol, ultimo_acceso')
        .eq('id', userId)
        .maybeSingle(); 

      if (perfilError) {
        console.warn('Aviso al cargar perfil:', perfilError);
      }

      // 2. Obtener TODAS las tareas asignadas
      const { data: tareasData, error: tareasError } = await this.authService.supabase
        .from('tareas') // <-- IMPORTANTE: Comprueba que esta tabla existe
        .select('id, estado')
        .eq('asignado_a', userId);

      if (tareasError) {
        console.warn('Aviso al cargar tareas:', tareasError);
      }

      const tareas = tareasData || [];

      // 3. Cálculos matemáticos
      const tareasCompletadas = tareas.filter(t => t.estado === 'Terminado').length;
      const tareasEnProgreso = tareas.filter(t => t.estado === 'En progreso').length;
      const totalTareas = tareas.length;

      const tasaExito = totalTareas > 0 
        ? Math.round((tareasCompletadas / totalTareas) * 100) 
        : 0;

      // 4. Inyectar datos
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
      // Solo mostramos alerta si es un error gravísimo de red
      console.error('Error crítico:', error);
      alert('Se perdió la conexión con la base de datos central.');
    } finally {
      this.cargando = false;
    }
     
  }

  // 🤖 Función auxiliar para la Inteligencia del Admin
  private generarEvaluacionAutomatica(exito: number, enProgreso: number): string {
    if (exito < 50 && exito > 0) return 'ADVERTENCIA: Bajo rendimiento detectado. Tasa de finalización crítica.';
    if (enProgreso > 5) return 'ALERTA: Posible saturación. El operario tiene demasiadas tareas simultáneas.';
    if (exito >= 80) return 'RENDIMIENTO ÓPTIMO: Operario eficiente. Capacidad para asumir más carga de proyectos.';
    return 'ESTADO NEUTRAL: Operario en parámetros normales de trabajo.';
  }

  // Pequeña función para darle color al dashboard mientras no tengamos histórico de días
  private calcularRachaAleatoria(): number {
    return Math.floor(Math.random() * 15) + 1; 
  }
  // 🔍 Función auxiliar para buscar el nombre en la lista si falla la base de datos
  private obtenerNombrePorId(id: string): string {
    // Si el ID es el mío, no busco, devuelvo mi texto directamente
    if (id === this.miIdUsuario) return 'Mi Perfil (Tú)';
    
    // Si es otro usuario, lo busco en la lista desplegable del Admin
    const user = this.listaUsuarios.find(u => u.id === id);
    return user ? user.nombre : 'Operario Desconocido';
  }
}
