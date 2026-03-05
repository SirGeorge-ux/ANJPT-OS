import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../infra/auth.service'; // Asegúrate de que esta ruta sea correcta en tu proyecto
import { FormsModule } from '@angular/forms'; // Importamos FormsModule para usar [(ngModel)] en la plantilla
import { DragDropModule } from '@angular/cdk/drag-drop'; // Importamos DragDropModule para usar las funcionalidades de arrastrar y soltar
import { CommonModule } from '@angular/common'; // Importamos CommonModule para usar directivas comunes como *ngFor y *ngIf

@Component({
  selector: 'app-admin',
  imports: [FormsModule, DragDropModule, CommonModule], 
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  // 1. Inyectamos nuestro servicio
  private authService = inject(AuthService);

  // 2. Preparamos las variables para la vista
  name = '';
  rol = '';
  numeroProyectos = 2; // Este número es solo un ejemplo, en una aplicación real lo obtendríamos de la base de datos o del estado de la aplicación
  numeroColaboradores = 3; // Este número es solo un ejemplo, en una aplicación real lo obtendríamos de la base de datos o del estado de la aplicación
  nombresProyectos = ['ProyectoAso','Proyecto Alpha','ProyectoCRM']; // Este nombre es solo un ejemplo, en una aplicación real lo obtendríamos de la base de datos o del estado de la aplicación
  numeroTareas = 5; // Este número es solo un ejemplo, en una aplicación real lo obtendríamos de la base de datos o del estado de la aplicación 
  tareas = ['Tarea 1', 'Tarea 2', 'Tarea 3', 'Tarea 4', 'Tarea 5']; // Este nombre es solo un ejemplo, en una aplicación real lo obtendríamos de la base de datos o del estado de la aplicación
  tareasCompletadas = 2; // Este número es solo un ejemplo, en una aplicación real lo obtendríamos de la base de datos o del estado de la aplicación
  tareasPendientes = 3; // Este número es solo un ejemplo, en una aplicación real lo obtendríamos de la base de datos o del estado de la aplicación 
  promedioTareas = 2.5; // Este número es solo un ejemplo, en una aplicación real lo obtendríamos de la base de datos o del estado de la aplicación
  columnas = ['Bandeja de entrada', 'Por hacer', 'En progreso', 'En revisión', 'Terminado']; // Este nombre es solo un ejemplo, en una aplicación real lo obtendríamos de la base de datos o del estado de la aplicación


  // 3. Cargamos los datos automáticamente al abrir la pantalla
  async ngOnInit() {
    const { data: { session } } = await this.authService.getSession();
    
    // Extraemos la información de la propiedad especial user_metadata
    this.name = session?.user.user_metadata?.['name'] || 'Socio';
    this.rol = session?.user.user_metadata?.['role'] || 'Sin rol asignado'; 
  }
}