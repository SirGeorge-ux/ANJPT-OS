import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Activity, Clock, Code, AlertTriangle, Flame } from 'lucide-angular';
// 🔥 EL MOTOR DE CHART.JS
import Chart from 'chart.js/auto';

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
  // --- MOTOR GRÁFICO ---
  public chartRendimiento: any; // Guarda la gráfica para poder destruirla y redibujarla si cambias de usuario
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

  // --- GAMIFICACIÓN Y CONTROL DE VERSIONES ---
  public rankingOperarios: any[] = [];
  public feedCommits: any[] = [];

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

    if (this.rolUsuario === 'ADMIN') {
      await this.cargarListaUsuarios();
    }

    await this.cargarDatosAuditoria(this.usuarioSeleccionadoId);
    
    // 🔥 INICIAMOS LOS RADARES DE GOGS
    await this.cargarRanking();
    await this.cargarFeed();
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
      
      // 🔥 EL TRUCO: Esperamos 50 milisegundos para que Angular 
      // tenga tiempo de quitar el *ngIf="cargando" y colocar el <canvas> en el HTML real.
      setTimeout(() => {
        this.renderizarGrafica();
      }, 50);
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
  // 📊 MOTOR DE RENDERIZADO VISUAL (CHART.JS)
  private renderizarGrafica() {
    const canvas = document.getElementById('graficaRendimiento') as HTMLCanvasElement;
    if (!canvas) {
      console.warn('Lienzo no encontrado. Abortando renderizado.');
      return;
    }

    // Si ya había una gráfica de otro usuario, la destruimos para no sobrecargar la memoria
    if (this.chartRendimiento) {
      this.chartRendimiento.destroy();
    }

    // Datos simulados (Histórico de los últimos 7 días)
    // En el futuro podríamos calcular esto leyendo las fechas de las tareas
    const labelsDias = ['Día -6', 'Día -5', 'Día -4', 'Día -3', 'Día -2', 'Ayer', 'Hoy'];
    const datosCompletadas = [2, 3, 1, 5, 4, 7, this.metricasUsuario.tareasCompletadas || 8];
    const datosCarga = [5, 4, 6, 4, 5, 3, this.metricasUsuario.anchoBanda || 2];

    this.chartRendimiento = new Chart(canvas, {
      type: 'line', // Tipo de gráfica (Líneas de tendencia)
      data: {
        labels: labelsDias,
        datasets: [
          {
            label: 'Tareas Completadas',
            data: datosCompletadas,
            borderColor: '#00e5ff', // Turquesa Neón
            backgroundColor: 'rgba(0, 229, 255, 0.1)', // Fondo semitransparente
            borderWidth: 3,
            tension: 0.4, // Curva suave (0 = líneas rectas)
            fill: true, // Rellena el área bajo la curva
            pointBackgroundColor: '#000',
            pointBorderColor: '#00e5ff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7
          },
          {
            label: 'Carga de Trabajo',
            data: datosCarga,
            borderColor: '#bf5af2', // Morado Neón
            borderWidth: 2,
            borderDash: [5, 5], // Línea punteada táctica
            tension: 0.4,
            pointRadius: 0 // Sin puntos para que sea más limpia
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // Permite que se adapte al alto del div padre
        interaction: { mode: 'index', intersect: false }, // Tooltip al pasar el ratón por cualquier zona vertical
        plugins: {
          legend: {
            labels: { color: '#ccc', font: { family: 'monospace', size: 11 } }
          },
          tooltip: {
            backgroundColor: 'rgba(10, 10, 10, 0.9)',
            titleColor: '#00e5ff',
            bodyColor: '#fff',
            borderColor: '#333',
            borderWidth: 1,
            titleFont: { family: 'monospace' }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' }, // Cuadrícula muy sutil
            ticks: { color: '#888', font: { family: 'monospace' }, stepSize: 2 }
          },
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#888', font: { family: 'monospace' } }
          }
        }
      }
    });
  }
  // 🏆 DESCARGA EL RANKING DE XP
  async cargarRanking() {
    const { data, error } = await this.authService.supabase
      .from('perfiles')
      .select('nombre, rol, puntos_xp')
      .order('puntos_xp', { ascending: false })
      .limit(5); // Traemos al Top 5
    
    if (!error && data) {
      this.rankingOperarios = data;
    }
  }

  // 📡 DESCARGA EL FEED EN TIEMPO REAL DESDE GOGS
  async cargarFeed() {
    // Usamos las relaciones de Supabase para traer el nombre del repositorio y del operario
    const { data, error } = await this.authService.supabase
      .from('gogs_commits')
      .select(`
        id,
        message,
        timestamp,
        url,
        gogs_repositories ( name ),
        perfiles ( nombre )
      `)
      .order('timestamp', { ascending: false })
      .limit(8); // Últimos 8 commits
    
    if (!error && data) {
      this.feedCommits = data;
    }
  }
}