import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../infra/auth.service';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-proyectos',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './proyectos.component.html',
  styleUrl: './proyectos.component.css'
})

export class ProyectosComponent implements OnInit {
  private authService = inject(AuthService);

  rolUsuario: string = 'JUNIOR';
  proyectos: any[] = []; 

  // 📝 VARIABLES PARA EL FORMULARIO
  mostrarFormulario: boolean = false;
  nuevoProyecto = {
    nombre: '',
    descripcion: '',
    stack: '' // Lo pediremos separado por comas y luego lo convertiremos
  };

  async ngOnInit() {
    const { data: { session } } = await this.authService.getSession();
    this.rolUsuario = session?.user.user_metadata?.['rol'] || 'JUNIOR';
    await this.cargarProyectos();
  }

  async cargarProyectos() {
    const { data, error } = await this.authService.supabase
      .from('proyectos')
      .select('*')
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('Error al descargar:', error);
    } else {
      this.proyectos = data || [];
    }
  }

  // 🛠️ Función para abrir/cerrar el panel del formulario
  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
  }

  // 🚀 FUNCIÓN PARA GUARDAR EN SUPABASE
  async guardarProyecto() {
    // 1. Convertimos el texto "Angular, Supabase" en un Array real ['Angular', 'Supabase']
    const stackArray = this.nuevoProyecto.stack
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    // 2. Preparamos el paquete de datos
    const proyectoAInsertar = {
      nombre: this.nuevoProyecto.nombre,
      descripcion: this.nuevoProyecto.descripcion,
      stack: stackArray,
      estado: 'PLANIFICACIÓN', // Empieza en planificación por defecto
      progreso: 0 // Empieza al 0%
    };

    // 3. Lo enviamos a la base de datos
    const { error } = await this.authService.supabase
      .from('proyectos')
      .insert([proyectoAInsertar]);

    if (error) {
      console.error('Error al guardar:', error);
      alert('Hubo un error al crear el proyecto.');
    } else {
      // Si hay éxito: Limpiamos el formulario, lo ocultamos y recargamos la lista
      this.nuevoProyecto = { nombre: '', descripcion: '', stack: '' };
      this.mostrarFormulario = false;
      await this.cargarProyectos(); // 🔄 Recargamos las tarjetas
    }
  }
}