import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AuthService } from '../../../infra/auth.service';

// Definimos cómo es la estructura de una columna
interface ColumnaKanban {
  nombre: string;
  tareas: any[];
}

@Component({
  selector: 'app-mis-tareas',
  imports: [CommonModule, DragDropModule],
  templateUrl: './mis-tareas.component.html',
  styleUrl: './mis-tareas.component.css'
})

export class MisTareasComponent {
  private authService = inject(AuthService);

  userId: string = '';

  // 📦 NUESTRO TABLERO REAL
  // Cada columna tiene su propio nombre y su propia lista de tareas
  tablero: ColumnaKanban[] = [
    { nombre: 'Bandeja de entrada', tareas: [] },
    { nombre: 'Por hacer', tareas: [] },
    { nombre: 'En progreso', tareas: [] },
    { nombre: 'En revisión', tareas: [] },
    { nombre: 'Terminado', tareas: [] }
  ];

  async ngOnInit() {
    // 1. Descubrimos quién es el usuario actual
    const { data: { session } } = await this.authService.getSession();
    if (session) {
      this.userId = session.user.id;
      // 2. Si hay usuario, descargamos sus tareas
      await this.cargarTareas();
    }
  }

  // 📥 DESCARGAR TAREAS DE LA BASE DE DATOS
  async cargarTareas() {
    const { data, error } = await this.authService.supabase
      .from('tareas')
      .select('*')
      .eq('asignado_a', this.userId); // Filtro: Solo MIS tareas

    if (error) {
      console.error('Error al descargar tareas:', error);
      return;
    }

    // Vaciamos el tablero por si acaso
    this.tablero.forEach(col => col.tareas = []);

    // Repartimos cada tarea en su columna correspondiente
    if (data) {
      data.forEach(tarea => {
        const columnaDestino = this.tablero.find(col => col.nombre === tarea.estado);
        if (columnaDestino) {
          columnaDestino.tareas.push(tarea);
        } else {
          this.tablero[0].tareas.push(tarea); // Si hay un error de nombre, va a la bandeja de entrada
        }
      });
    }
  }

  // 🔄 ARRASTRAR Y SOLTAR (Con guardado en la nube)
  async drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      // Solo hemos ordenado dentro de la misma columna
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // ¡HEMOS MOVIDO LA TAREA DE COLUMNA!
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      // 1. Identificamos qué tarea se ha movido
      const tareaMovida = event.container.data[event.currentIndex];
      
      // 2. Averiguamos el nombre de la nueva columna buscando en nuestro tablero
      const columnaNueva = this.tablero.find(col => col.tareas === event.container.data);

      if (columnaNueva) {
        // 3. Guardamos el nuevo estado en Supabase
        const { error } = await this.authService.supabase
          .from('tareas')
          .update({ estado: columnaNueva.nombre })
          .eq('id', tareaMovida.id); // Usamos el ID de la base de datos para actualizarla

        if (error) {
          console.error('Error al guardar el nuevo estado:', error);
          alert('Hubo un error de conexión al mover la tarea.');
        }
      }
    }
  }
}