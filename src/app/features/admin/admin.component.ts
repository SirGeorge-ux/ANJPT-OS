import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../infra/auth.service';
import { FormsModule } from '@angular/forms'; 
import { DragDropModule } from '@angular/cdk/drag-drop'; 
import { CommonModule } from '@angular/common'; 

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
  numeroProyectos = 2; 
  numeroColaboradores = 3; 
  nombresProyectos = ['ProyectoAso','Proyecto Alpha','ProyectoCRM'];  
  numeroTareas = 5; 
  tareas = ['Tarea 1', 'Tarea 2', 'Tarea 3', 'Tarea 4', 'Tarea 5'];  
  tareasCompletadas = 2; 
  tareasPendientes = 3;
  promedioTareas = 2.5; 
  columnas = ['Bandeja de entrada', 'Por hacer', 'En progreso', 'En revisión', 'Terminado']; 

  // 3. Cargamos los datos automáticamente al abrir la pantalla
  async ngOnInit() {
    const { data: { session } } = await this.authService.getSession();
    
    // Extraemos la información de la propiedad especial user_metadata
    this.name = session?.user.user_metadata?.['name'] || 'Socio';
    this.rol = session?.user.user_metadata?.['role'] || 'Sin rol asignado'; 
  }
}