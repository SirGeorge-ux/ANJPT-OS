import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AuthService } from '../../../infra/auth.service';
import { TareasService } from '../../../infra/tareas.service'; 
import { ComentarioTarea } from '../../domain/models/types'; 
import { LucideAngularModule, MessageSquare, X, Send, RotateCcw } from 'lucide-angular'; 

interface ColumnaKanban {
  nombre: string;
  tareas: any[];
}

@Component({
  selector: 'app-mis-tareas',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule, LucideAngularModule],
  templateUrl: './mis-tareas.component.html',
  styleUrl: './mis-tareas.component.css'
})
export class MisTareasComponent implements OnInit {
  private authService = inject(AuthService);
  private tareasService = inject(TareasService); 

  readonly IconMessage = MessageSquare;
  readonly IconClose = X;
  readonly IconSend = Send;
  readonly IconDevolver = RotateCcw;

  public userId: string = '';

  public tablero: ColumnaKanban[] = [
    { nombre: 'Bandeja de entrada', tareas: [] },
    { nombre: 'Por hacer', tareas: [] },
    { nombre: 'En progreso', tareas: [] },
    { nombre: 'En revisión', tareas: [] },
    { nombre: 'Terminado', tareas: [] }
  ];

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

  async cargarTareas() {
    const { data, error } = await this.authService.supabase
      .from('tareas')
      .select('*, comentarios_tareas(id)') 
      .eq('asignado_a', this.userId);

    if (error) {
      console.error('Error al descargar tareas:', error);
      return;
    }

    this.tablero.forEach(col => col.tareas = []);
    if (data) {
      data.forEach(tarea => {
        tarea.tieneComentarios = tarea.comentarios_tareas && tarea.comentarios_tareas.length > 0;
        const columnaDestino = this.tablero.find(col => col.nombre === tarea.estado);
        if (columnaDestino) {
          columnaDestino.tareas.push(tarea);
        } else {
          this.tablero[0].tareas.push(tarea); 
        }
      });
    }
  }

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
        // Corrección del error 'this.supabase' -> es 'this.authService.supabase'
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

  async abrirDossier(tarea: any) {
    this.tareaSeleccionada = tarea;
    this.cargandoComentarios = true;
    this.comentarios = [];

    try {
      this.comentarios = await this.tareasService.getComentariosDeTarea(tarea.id);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      this.cargandoComentarios = false;
    }
  }

  cerrarDossier() {
    this.tareaSeleccionada = null;
    this.comentarios = [];
    this.nuevoComentario = '';
  }

  async enviarComentario() {
    if (!this.nuevoComentario.trim() || !this.tareaSeleccionada) return;

    const texto = this.nuevoComentario;
    this.nuevoComentario = ''; 

    try {
      await this.tareasService.addComentario(this.tareaSeleccionada.id, this.userId, texto);
      this.comentarios = await this.tareasService.getComentariosDeTarea(this.tareaSeleccionada.id);
      this.tareaSeleccionada.tieneComentarios = true;
    } catch (error) {
      console.error('Fallo en la transmisión del mensaje:', error);
      this.nuevoComentario = texto; 
    }
  }

  async enviarYDevolver() {
    if (!this.tareaSeleccionada) return;

    const texto = this.nuevoComentario.trim() ? this.nuevoComentario : '[SISTEMA] ⚠️ Tarea devuelta para revisión y corrección.';
    const nuevoEstado = 'En progreso'; 

    this.cargandoComentarios = true;

    try {
      await this.tareasService.addComentario(this.tareaSeleccionada.id, this.userId, texto);
      await this.tareasService.updateEstadoTarea(this.tareaSeleccionada.id, nuevoEstado);

      const columnaAntigua = this.tablero.find(col => col.nombre === this.tareaSeleccionada.estado);
      if (columnaAntigua) {
        columnaAntigua.tareas = columnaAntigua.tareas.filter(t => t.id !== this.tareaSeleccionada.id);
      }
      
      const columnaNueva = this.tablero.find(col => col.nombre === nuevoEstado);
      if (columnaNueva) {
        this.tareaSeleccionada.estado = nuevoEstado;
        this.tareaSeleccionada.tieneComentarios = true;
        columnaNueva.tareas.push(this.tareaSeleccionada);
      }

      this.cerrarDossier();

    } catch (error) {
      console.error('Error en la Acción Rápida:', error);
      alert('Hubo un error al procesar la acción rápida.');
    } finally {
      this.cargandoComentarios = false;
    }
  }
}