import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Añadido para los inputs del chat
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AuthService } from '../../../infra/auth.service';
import { TareasService } from '../../../infra/tareas.service'; // Inyectamos nuestro nuevo servicio
import { ComentarioTarea } from '../../domain/models/types'; // Importamos la interfaz (ajusta la ruta si es necesario)
import { LucideAngularModule, MessageSquare, X, Send } from 'lucide-angular'; // Iconos para el UI

interface ColumnaKanban {
  nombre: string;
  tareas: any[];
}

@Component({
  selector: 'app-mis-tareas',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule, LucideAngularModule], // Añadimos FormsModule y Lucide
  templateUrl: './mis-tareas.component.html',
  styleUrl: './mis-tareas.component.css'
})
export class MisTareasComponent implements OnInit {
  // Inyección de dependencias limpia
  private authService = inject(AuthService);
  private tareasService = inject(TareasService); 

  // 🎨 Iconos UI
  readonly IconMessage = MessageSquare;
  readonly IconClose = X;
  readonly IconSend = Send;

  public userId: string = '';

  // 📦 NUESTRO TABLERO REAL
  public tablero: ColumnaKanban[] = [
    { nombre: 'Bandeja de entrada', tareas: [] },
    { nombre: 'Por hacer', tareas: [] },
    { nombre: 'En progreso', tareas: [] },
    { nombre: 'En revisión', tareas: [] },
    { nombre: 'Terminado', tareas: [] }
  ];

  // ==========================================
  // 📂 ESTADO DEL EXPEDIENTE (NUEVO)
  // ==========================================
  public tareaSeleccionada: any | null = null;
  public comentarios: ComentarioTarea[] = [];
  public nuevoComentario: string = '';
  public cargandoComentarios: boolean = false;

  async ngOnInit() {
    const { data: { session } } = await this.authService.getSession();
    if (session) {
      this.userId = session.user.id;
      await this.cargarTareas();
    }
  }

  // 📥 DESCARGAR TAREAS 
  async cargarTareas() {
    // NOTA TECH LEAD: En el futuro, moveremos esta llamada al TareasService para cumplir SOLID al 100%
    const { data, error } = await this.authService.supabase
      .from('tareas')
      .select('*')
      .eq('asignado_a', this.userId);

    if (error) {
      console.error('Error al descargar tareas:', error);
      return;
    }

    this.tablero.forEach(col => col.tareas = []);
    if (data) {
      data.forEach(tarea => {
        const columnaDestino = this.tablero.find(col => col.nombre === tarea.estado);
        if (columnaDestino) {
          columnaDestino.tareas.push(tarea);
        } else {
          this.tablero[0].tareas.push(tarea); 
        }
      });
    }
  }

  // 🔄 ARRASTRAR Y SOLTAR 
  async drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      const tareaMovida = event.container.data[event.currentIndex];
      const columnaNueva = this.tablero.find(col => col.tareas === event.container.data);
      
      if (columnaNueva) {
        // NOTA TECH LEAD: En el futuro, moveremos esta llamada al TareasService
        const { error } = await this.authService.supabase
          .from('tareas')
          .update({ estado: columnaNueva.nombre })
          .eq('id', tareaMovida.id);

        if (error) {
          console.error('Error al guardar el nuevo estado:', error);
          alert('Hubo un error de conexión al mover la tarea.');
        }
      }
    }
  }

  // ==========================================
  // 🚀 LÓGICA DEL EXPEDIENTE Y CHAT (NUEVO)
  // ==========================================

  // Abre el panel lateral/inferior y carga el historial
  async abrirDossier(tarea: any) {
    this.tareaSeleccionada = tarea;
    this.cargandoComentarios = true;
    this.comentarios = []; // Limpiamos residuos de la tarea anterior

    try {
      this.comentarios = await this.tareasService.getComentariosDeTarea(tarea.id);
    } catch (error) {
      console.error('Error al cargar historial de comunicaciones:', error);
    } finally {
      this.cargandoComentarios = false;
    }
  }

  // Cierra el panel
  cerrarDossier() {
    this.tareaSeleccionada = null;
    this.comentarios = [];
    this.nuevoComentario = '';
  }

  // Enviar mensaje a Supabase
  async enviarComentario() {
    // Protecciones básicas (Early Return)
    if (!this.nuevoComentario.trim() || !this.tareaSeleccionada) return;

    const texto = this.nuevoComentario;
    this.nuevoComentario = ''; // Vaciamos el input al instante para dar sensación de velocidad (UX)

    try {
      // 1. Guardamos en la base de datos
      await this.tareasService.addComentario(this.tareaSeleccionada.id, this.userId, texto);
      
      // 2. Recargamos la lista para que aparezca el nuevo mensaje con su fecha y autor
      this.comentarios = await this.tareasService.getComentariosDeTarea(this.tareaSeleccionada.id);
    } catch (error) {
      console.error('Fallo en la transmisión del mensaje:', error);
      this.nuevoComentario = texto; // Si falla, le devolvemos el texto al usuario para que no lo pierda
    }
  }
}