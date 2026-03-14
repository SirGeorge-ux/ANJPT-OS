import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../infra/auth.service';
import { ProyectosService } from '../../../infra/proyectos.service';
import { TareasService } from '../../../infra/tareas.service';
import { Proyecto, Task } from '../../domain/models/types';
import { 
  LucideAngularModule, 
  ChevronsLeftRightEllipsis, 
  Eye, 
  Wrench, 
  CircleCheckBig,
  ChessQueen,     
  CircleUser,     
  UserRoundSearch, 
  FileInput,       
  LogOut,
  Calendar, 
  AlignLeft,
} from 'lucide-angular';

@Component({
  selector: 'app-proyecto-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule], 
  templateUrl: './proyecto-detalle.component.html',
  styleUrls: ['./proyecto-detalle.component.css']
})
export class ProyectoDetalleComponent implements OnInit {

  // 🛰️ Inyecciones de Dependencias
  private readonly route = inject(ActivatedRoute);
  public readonly authService = inject(AuthService);
  private readonly proyectosService = inject(ProyectosService);
  private readonly tareasService = inject(TareasService);

  // ⏱️ MOTORES DEL GANTT
  public fechaMinimaGantt: Date = new Date();
  public totalDiasGantt: number = 30;
  public fechasGantt: Date[] = [];
  public posicionHoy: number = -1;

  private readonly cdr = inject(ChangeDetectorRef);

  // 🎨 Identificadores de Iconos
  readonly IconPorHacer = ChevronsLeftRightEllipsis;
  readonly IconRevisar = Eye;
  readonly IconEnProgreso = Wrench;
  readonly IconTerminado = CircleCheckBig;
  readonly IconLider = ChessQueen;
  readonly IconColab = CircleUser;
  readonly IconMantenedor = UserRoundSearch;
  readonly IconDocumentalista = FileInput;
  readonly IconSalir = LogOut;
  readonly IconCalendar = Calendar;
  readonly IconAlign = AlignLeft;

  // 📂 Datos del Modelo
  public proyectoId: string = '';
  public proyecto: Proyecto | null = null;
  public tareasDelProyecto: Task[] = [];
  public usuarios: any[] = [];
  
  // 🛡️ Estado de Seguridad y UI
  public rolUsuario: string = 'JUNIOR';
  public nivelUsuario: number = 1;
  public mostrarFormularioTarea: boolean = false;
  public loading: boolean = false;

  // --- LISTA DE OPERARIOS PARA EL DESPLEGABLE ---
  public listaUsuarios: any[] = [];

  // 📝 Modelo del Formulario (Ahora incluye el motor de tiempo)
  public nuevaTarea = {
    titulo: '',
    descripcion: '',
    asignado_a: '',
    fecha_inicio: '', 
    fecha_fin: '',
    progreso: 0,
    es_hito: false,                    
    depende_de_id: null as number | null     
  };

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.proyectoId = id;
      await this.obtenerUsuarios();
      await this.inicializarDatos(id);
      await this.cargarListaUsuarios();
    }
  }

  // Carga colaboradores de la tabla 'perfiles'
  async obtenerUsuarios() {
    const { data, error } = await this.authService.supabase
      .from('perfiles')
      .select('id, nombre');

    if (error) {
      console.error('Error al cargar colaboradores:', error);
    } else {
      this.usuarios = data || [];
    }
  }

  // Carga sesión y datos del proyecto
  private async inicializarDatos(id: string): Promise<void> {
    const { data: { session } } = await this.authService.getSession();
    
    if (session) {
      this.rolUsuario = session.user.user_metadata?.['rol'] || 'JUNIOR';
      this.nivelUsuario = session.user.user_metadata?.['nivel'] || 1;
    } 

    this.loading = true;
    console.log("🔍 BUSCANDO PROYECTO CON ID:", id);

    try {
      // Descarga paralela usando nuestros Servicios Hexagonales
      const [proyectoData, tareasData] = await Promise.all([
        this.proyectosService.getProyectoById(id),
        this.tareasService.getTareasPorProyecto(id)
      ]);

      console.log("📦 DATOS DEL PROYECTO RECIBIDOS:", proyectoData); 
      console.log("📦 DATOS DE TAREAS RECIBIDOS:", tareasData);

      this.proyecto = proyectoData as Proyecto;
      this.tareasDelProyecto = tareasData as Task[] || [];

      this.generarGantt();

      this.cdr.detectChanges();

    } catch (error) {
      console.error('Error al cargar el expediente:', error);
    } finally {
      this.loading = false;
    }
  }

  // 🛠️ ACCIONES DE INTERFAZ
  toggleFormularioTarea(): void {
    this.mostrarFormularioTarea = !this.mostrarFormularioTarea;
  }

  async guardarTarea(): Promise<void> {
    // 1. Verificación estricta de datos (incluyendo las nuevas fechas)
    if (!this.proyecto || !this.nuevaTarea.titulo || !this.nuevaTarea.asignado_a || !this.nuevaTarea.fecha_inicio || !this.nuevaTarea.fecha_fin) {
      alert("Operación abortada: Título, Operario asignado y Fechas son obligatorios.");
      return; 
    }

    // 2. Control de paradojas temporales
    if (new Date(this.nuevaTarea.fecha_fin) < new Date(this.nuevaTarea.fecha_inicio)) {
      alert("Paradoja detectada: La fecha de finalización no puede ser anterior a la de inicio.");
      return;
    }

    this.loading = true;
    try {
      // 3. Empaquetado y envío usando el servicio
      const paqueteTarea = {
        titulo: this.nuevaTarea.titulo,
        descripcion: this.nuevaTarea.descripcion,
        estado: 'Por hacer', 
        proyecto_id: this.proyectoId,
        asignado_a: this.nuevaTarea.asignado_a,
        fecha_inicio: this.nuevaTarea.fecha_inicio,
        fecha_fin: this.nuevaTarea.fecha_fin
      };

      await this.tareasService.addTareaAProyecto(paqueteTarea);
      
      this.resetearFormulario();
      
      // Recargamos el backlog para ver la nueva tarea
      const tareasData = await this.tareasService.getTareasPorProyecto(this.proyectoId);
      this.tareasDelProyecto = tareasData as Task[] || [];

    } catch (error) {
      console.error('Error al crear tarea:', error);
      alert('Error crítico al guardar la tarea en el núcleo.');
    } finally {
      this.loading = false;
    }
  }

  private resetearFormulario(): void {
    this.nuevaTarea = {
      titulo: '',
      descripcion: '',
      asignado_a: '',
      fecha_inicio: '',
      fecha_fin: '',
      progreso: 0,
      es_hito: false, 
      depende_de_id: null
    };
    this.mostrarFormularioTarea = false;
  }

  solicitarParticipacion(): void {
    alert('Solicitud enviada al administrador.'); 
  }
  // 📊 MOTOR MATEMÁTICO DEL GANTT
  generarGantt() {
    if (!this.tareasDelProyecto || this.tareasDelProyecto.length === 0) return;

    // Filtramos solo las tareas que tienen fechas asignadas
    const tareasConFechas = this.tareasDelProyecto.filter(t => t.fecha_inicio && t.fecha_fin);
    if (tareasConFechas.length === 0) return;

    // Buscamos el día que empieza el proyecto (la tarea más antigua)
    const fechasInicio = tareasConFechas.map(t => new Date(t.fecha_inicio!).getTime());
    this.fechaMinimaGantt = new Date(Math.min(...fechasInicio));

    // Buscamos el día que acaba el proyecto (la tarea más lejana)
    const fechasFin = tareasConFechas.map(t => new Date(t.fecha_fin!).getTime());
    const fechaMaxima = new Date(Math.max(...fechasFin));

    // Calculamos el total de días que dura el proyecto (+2 de margen visual)
    const milisegundos = Math.abs(fechaMaxima.getTime() - this.fechaMinimaGantt.getTime());
    this.totalDiasGantt = Math.ceil(milisegundos / (1000 * 60 * 60 * 24)) + 2; 
    // Creamos un array vacío para que el HTML pueda pintar los números de los días
    this.fechasGantt = [];
    for (let i = 0; i < this.totalDiasGantt; i++) {
      const dia = new Date(this.fechaMinimaGantt);
      dia.setDate(dia.getDate() + i);
      this.fechasGantt.push(dia);
    }
    // Calculamos dónde debe caer el láser de HOY
    const fechaHoy = new Date().getTime();
    this.posicionHoy = Math.ceil((fechaHoy - this.fechaMinimaGantt.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  // 🎨 CALCULA LA POSICIÓN DE LA BARRA NEÓN EN LA PANTALLA
  getGanttStyle(tarea: Task) {
    if (!tarea.fecha_inicio || !tarea.fecha_fin) return { display: 'none' };

    const inicio = new Date(tarea.fecha_inicio).getTime();
    const fin = new Date(tarea.fecha_fin).getTime();
    const min = this.fechaMinimaGantt.getTime();

    // ¿En qué columna empieza?
    const offset = Math.ceil((inicio - min) / (1000 * 60 * 60 * 24)) + 1; 
    // ¿Cuántas columnas (días) dura?
    const duracion = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;

    return {
      'grid-column': `${offset} / span ${duracion > 0 ? duracion : 1}`
    };
  }
  // 👤 TRADUCTOR DE ID A NOMBRE DE OPERARIO
  getNombreOperario(id: string | undefined): string {
    if (!id) return 'Sin asignar';
    const user = this.usuarios.find(u => u.id === id);
    return user ? user.nombre : 'Operario Desconocido';
  }
  // 📡 DESCARGA LOS OPERARIOS PARA PODER ASIGNAR TAREAS
  async cargarListaUsuarios() {
    const { data, error } = await this.authService.supabase
      .from('perfiles')
      .select('id, nombre, rol');
      
    if (!error && data) {
      this.listaUsuarios = data;
    } else {
      console.error('Error cargando usuarios:', error);
    }
  }
}
// Radar activo