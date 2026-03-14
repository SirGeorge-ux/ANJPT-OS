import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Activity, Clock, Code, AlertTriangle, Flame } from 'lucide-angular';
import Chart from 'chart.js/auto';

// 🔥 INYECCIÓN DEL SERVICIO CENTRAL
import { AuthService } from '../../../infra/auth.service';

@Component({
  selector: 'app-metricas',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './metricas.component.html',
  styleUrls: ['./metricas.component.css']
})
export class MetricasComponent implements OnInit, OnDestroy {
  
  // ==========================================================
  // 1. DEPENDENCIAS Y VARIABLES DE ESTADO
  // ==========================================================
  public readonly authService = inject(AuthService);

  // --- Iconos Interfaz ---
  public IconBuscar = Search;
  public IconActividad = Activity;
  public IconReloj = Clock;
  public IconCodigo = Code;
  public IconAlerta = AlertTriangle;
  public IconRacha = Flame;

  // --- Estado de la Pantalla ---
  public cargando: boolean = false;
  public rolUsuario: string = 'JUNIOR';
  public miIdUsuario: string = '';
  public usuarioSeleccionadoId: string = '';
  public listaUsuarios: any[] = [];

  // --- Datos de Componentes Visuales ---
  public rankingOperarios: any[] = [];
  public feedCommits: any[] = [];
  public chartRendimiento: any; 
  public radarTiempoReal: any; // Antena WebSocket

  // --- Objeto DTO para las Métricas del Panel Central ---
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

  // ==========================================================
  // 2. CICLO DE VIDA DEL COMPONENTE (Hooks)
  // ==========================================================
  
  async ngOnInit(): Promise<void> {
    // 1. Identificación del Operario
    const { data: { session } } = await this.authService.getSession();
    
    if (session) {
      this.rolUsuario = session.user.user_metadata?.['rol'] || 'JUNIOR';
      this.miIdUsuario = session.user.id;
      this.usuarioSeleccionadoId = this.miIdUsuario;
      this.metricasUsuario.nombre = session.user.user_metadata?.['nombre'] || 'Operario Local';
      this.metricasUsuario.nivel = session.user.user_metadata?.['nivel'] || 1;
    }

    // 2. Carga de Permisos y Datos Base
    if (this.rolUsuario === 'ADMIN') {
      await this.cargarListaUsuarios();
    }

    // 3. Descarga de Inteligencia Táctica
    await this.cargarDatosAuditoria(this.usuarioSeleccionadoId);
    await this.cargarRanking();
    await this.cargarFeed();

    // 4. Encendemos los sistemas de Tiempo Real
    this.activarRadarTiempoReal();
  }

  ngOnDestroy() {
    // Apagamos la antena al salir para evitar fugas de memoria
    if (this.radarTiempoReal) {
      this.authService.supabase.removeChannel(this.radarTiempoReal);
      console.log('🛑 Radar WebSocket Desconectado.');
    }
    // Destruimos el motor gráfico
    if (this.chartRendimiento) {
      this.chartRendimiento.destroy();
    }
  }

  // ==========================================================
  // 3. MOTORES DE COMUNICACIÓN (WebSockets y Base de Datos)
  // ==========================================================
  
  activarRadarTiempoReal() {
    this.radarTiempoReal = this.authService.supabase
      .channel('transmisiones-centro-mando')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'gogs_commits' },
        (payload: any) => {
          console.log('📡 ¡Transmisión entrante detectada desde Gogs!', payload);
          
          // Actualizamos el panel visual en vivo
          this.cargarFeed();     // Recarga la terminal negra
          this.cargarRanking();  // Recarga el podio de XP
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('🟢 Radar WebSocket Conectado y a la espera de commits...');
        }
      });
  }

  async cargarListaUsuarios() {
    const { data, error } = await this.authService.supabase
      .from('perfiles')
      .select('id, nombre, rol');
      
    if (!error && data) {
      this.listaUsuarios = data;
    }
  }

  async cargarRanking() {
    const { data, error } = await this.authService.supabase
      .from('perfiles')
      .select('nombre, rol, puntos_xp')
      .order('puntos_xp', { ascending: false })
      .limit(5); // Top 5
    
    if (!error && data) {
      this.rankingOperarios = data;
    }
  }

  async cargarFeed() {
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
      .limit(8); // Últimos 8 commits de la red
    
    if (!error && data) {
      this.feedCommits = data;
    }
  }

  // ==========================================================
  // 4. LÓGICA DE AUDITORÍA Y GRÁFICOS (Chart.js)
  // ==========================================================
  
  async cambiarUsuarioAuditado() {
    if (this.usuarioSeleccionadoId) {
      await this.cargarDatosAuditoria(this.usuarioSeleccionadoId);
    }
  }

  async cargarDatosAuditoria(userId: string) {
    this.cargando = true;
    
    try {
      // 1. Descargamos el Perfil
      const { data: perfilData, error: perfilError } = await this.authService.supabase
        .from('perfiles')
        .select('nombre, rol, ultimo_acceso')
        .eq('id', userId)
        .maybeSingle();
        
      if (perfilError) console.warn('Aviso al cargar perfil:', perfilError);

      // 2. Descargamos sus Tareas
      const { data: tareasData, error: tareasError } = await this.authService.supabase
        .from('tareas')
        .select('id, estado')
        .eq('asignado_a', userId);
        
      if (tareasError) console.warn('Aviso al cargar tareas:', tareasError);

      // 3. Cálculos Tácticos
      const tareas = tareasData || [];
      const tareasCompletadas = tareas.filter(t => t.estado === 'TERMINADO').length; // Ajustado a mayúsculas según base de datos
      const tareasEnProgreso = tareas.filter(t => t.estado !== 'TERMINADO').length;
      const totalTareas = tareas.length;
      const tasaExito = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;

      // 4. Actualizamos el DTO Visual
      this.metricasUsuario = {
        nombre: perfilData?.nombre || this.obtenerNombrePorId(userId),
        nivel: perfilData?.rol === 'SENIOR' ? 2 : (perfilData?.rol === 'ADMIN' ? 3 : 1),
        tasaExito: tasaExito,
        velocidadMedia: 2.5, 
        tareasCompletadas: tareasCompletadas,
        anchoBanda: tareasEnProgreso,
        rachaDias: await this.calcularRachaReal(userId),
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
      console.error('Error crítico en auditoría:', error);
      alert('Se perdió la conexión con la base de datos central.');
    } finally {
      this.cargando = false;
      
      // Esperamos a que Angular renderice el DOM para inyectar la gráfica
      setTimeout(() => {
        this.renderizarGrafica();
      }, 50);
    }
  }

  private renderizarGrafica() {
    const canvas = document.getElementById('graficaRendimiento') as HTMLCanvasElement;
    
    if (!canvas) {
      console.warn('Lienzo no encontrado. Abortando renderizado ChartJS.');
      return;
    }

    if (this.chartRendimiento) {
      this.chartRendimiento.destroy();
    }

    const labelsDias = ['Día -6', 'Día -5', 'Día -4', 'Día -3', 'Día -2', 'Ayer', 'Hoy'];
    const datosCompletadas = [2, 3, 1, 5, 4, 7, this.metricasUsuario.tareasCompletadas || 8];
    const datosCarga = [5, 4, 6, 4, 5, 3, this.metricasUsuario.anchoBanda || 2];

    this.chartRendimiento = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labelsDias,
        datasets: [
          {
            label: 'Tareas Completadas',
            data: datosCompletadas,
            borderColor: '#00e5ff',
            backgroundColor: 'rgba(0, 229, 255, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#000',
            pointBorderColor: '#00e5ff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7
          },
          {
            label: 'Carga de Trabajo',
            data: datosCarga,
            borderColor: '#bf5af2',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.4,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: '#ccc', font: { family: 'monospace', size: 11 } } },
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
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
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

  // ==========================================================
  // 5. MÉTODOS AUXILIARES (Utilidades)
  // ==========================================================
  
  private generarEvaluacionAutomatica(exito: number, enProgreso: number): string {
    if (exito < 50 && exito > 0) return 'ADVERTENCIA: Bajo rendimiento detectado. Tasa de finalización crítica.';
    if (enProgreso > 5) return 'ALERTA: Posible saturación. El operario tiene demasiadas tareas simultáneas.';
    if (exito >= 80) return 'RENDIMIENTO ÓPTIMO: Operario eficiente. Capacidad para asumir más carga de proyectos.';
    return 'ESTADO NEUTRAL: Operario en parámetros normales de trabajo.';
  }

  async calcularRachaReal(userId: string): Promise<number> {
    // 1. Descargamos todos los timestamps de los commits de este usuario
    const { data, error } = await this.authService.supabase
      .from('gogs_commits')
      .select('timestamp')
      .eq('perfil_id', userId)
      .order('timestamp', { ascending: false });

    if (error || !data || data.length === 0) return 1; // Si no hay historial, mínimo 1

    // 2. Extraemos los días únicos en los que ha trabajado (ignorando la hora)
    const diasUnicos = [...new Set(data.map((c: any) => new Date(c.timestamp).toDateString()))]
      .map(d => new Date(d));

    let racha = 1;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Ajustamos a medianoche para medir días justos

    // 3. ¿El último commit fue hace más de un día? (Racha rota)
    const diasDesdeUltimo = Math.floor((hoy.getTime() - diasUnicos[0].getTime()) / (1000 * 60 * 60 * 24));
    if (diasDesdeUltimo > 1) {
      return 1;
    }

    // 4. Contamos los días consecutivos hacia atrás
    for (let i = 0; i < diasUnicos.length - 1; i++) {
      const actual = diasUnicos[i];
      const anterior = diasUnicos[i + 1];
      const diffDias = Math.floor((actual.getTime() - anterior.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDias === 1) {
        racha++; // Día consecutivo, suma la racha
      } else {
        break; // Hueco de más de 24h, rompemos el bucle
      }
    }
    
    return racha;
  }

  private obtenerNombrePorId(id: string): string {
    if (id === this.miIdUsuario) return 'Mi Perfil (Tú)';
    const user = this.listaUsuarios.find(u => u.id === id);
    return user ? user.nombre : 'Operario Desconocido';
  }
}