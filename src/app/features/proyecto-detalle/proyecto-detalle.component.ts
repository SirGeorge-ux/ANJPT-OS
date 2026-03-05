import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../infra/auth.service';
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
  LogOut           
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

  // 🎨 Identificadores de Iconos (Para usar en el HTML)
  readonly IconPorHacer = ChevronsLeftRightEllipsis;
  readonly IconRevisar = Eye;
  readonly IconEnProgreso = Wrench;
  readonly IconTerminado = CircleCheckBig;
  readonly IconLider = ChessQueen;
  readonly IconColab = CircleUser;
  readonly IconMantenedor = UserRoundSearch;
  readonly IconDocumentalista = FileInput;
  readonly IconSalir = LogOut;

  // 📂 Datos del Modelo
  proyecto: any = null;
  tareasDelProyecto: any[] = [];
  usuarios: any[] = []; 

  // 🛡️ Estado de Seguridad y UI
  rolUsuario: string = 'JUNIOR';
  nivelUsuario: number = 1;
  mostrarFormularioTarea: boolean = false;
  loading: boolean = false;

  // 📝 Modelo del Formulario
  public nuevaTarea = {
    titulo: '',
    descripcion: '',
    asignado_a: '', 
    proyecto_id: ''
  };

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.nuevaTarea.proyecto_id = id;
      await this.inicializarDatos(id);
      await this.obtenerUsuarios();
    }
  }

  /**
   * Carga colaboradores de la tabla 'perfiles'
   */
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

  /**
   * Carga sesión y datos del proyecto
   */
  private async inicializarDatos(id: string): Promise<void> {
    const { data: { session } } = await this.authService.getSession();
    if (session) {
      this.rolUsuario = session.user.user_metadata?.['rol'] || 'JUNIOR';
      this.nivelUsuario = session.user.user_metadata?.['nivel'] || 1;
    } 

    await Promise.all([
      this.cargarDetallesProyecto(id),
      this.cargarTareasDelProyecto(id)
    ]);
  }

  // 📊 MÉTODOS DE CONSULTA (Corregidos para la tabla 'proyectos')

  async cargarDetallesProyecto(id: string): Promise<void> {
    // CAMBIO CLAVE: Se usa 'proyectos' en lugar de 'projects'
    const { data, error } = await this.authService.supabase
      .from('proyectos') 
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error cargando proyecto:', error);
    } else {
      this.proyecto = data;
    } 
  }

  async cargarTareasDelProyecto(id: string): Promise<void> {
    const { data, error } = await this.authService.supabase
      .from('tareas')
      .select('*')
      .eq('proyecto_id', id)
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('Error cargando tareas:', error);
    } else {
      this.tareasDelProyecto = data || [];
    } 
  }

  // 🛠️ ACCIONES DE INTERFAZ

  toggleFormularioTarea(): void {
    this.mostrarFormularioTarea = !this.mostrarFormularioTarea;
  }

  async guardarTarea(): Promise<void> {
    if (!this.proyecto || !this.nuevaTarea.titulo || !this.nuevaTarea.asignado_a) {
      alert("Completa todos los campos obligatorios.");
      return; 
    }

    this.loading = true;
    const { error } = await this.authService.supabase
      .from('tareas')
      .insert([{
        titulo: this.nuevaTarea.titulo,
        descripcion: this.nuevaTarea.descripcion,
        estado: 'Por hacer', 
        proyecto_id: this.proyecto.id,
        asignado_a: this.nuevaTarea.asignado_a
      }]);

    if (error) {
      console.error('Error al crear tarea:', error);
    } else {
      this.resetearFormulario();
      await this.cargarTareasDelProyecto(this.proyecto.id); 
    }
    this.loading = false;
  }

  private resetearFormulario(): void {
    this.nuevaTarea.titulo = '';
    this.nuevaTarea.descripcion = '';
    this.mostrarFormularioTarea = false;
  }

  solicitarParticipacion(): void {
    alert('Solicitud enviada al administrador.'); 
  }
}