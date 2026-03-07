import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../infra/auth.service';

@Component({
  selector: 'app-proyectos',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './proyectos.component.html',
  styleUrl: './proyectos.component.css'
})
export class ProyectosComponent implements OnInit {
  
  // 🛰️ Dependencias
  public readonly authService = inject(AuthService);

  // 📂 Datos
  rolUsuario: string = 'JUNIOR';
  proyectos: any[] = []; 

  // 📝 Variables para el Formulario y Estado UI
  mostrarFormulario: boolean = false;
  guardandoProyecto: boolean = false; // Bloquea el botón para evitar doble clic

  nuevoProyecto = {
    nombre: '',
    descripcion: '',
    stack: '', 
    estado: 'Activo' // Por defecto
  };

  // 🏁 Ciclo de vida
  async ngOnInit() {
    const { data: { session } } = await this.authService.getSession();
    this.rolUsuario = session?.user.user_metadata?.['rol'] || 'JUNIOR';
    await this.cargarProyectos();
  }

  // 📊 MÉTODOS DE LECTURA
  async cargarProyectos() {
    const { data, error } = await this.authService.supabase
      .from('proyectos')
      .select('*')
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('Error al descargar proyectos:', error);
    } else {
      this.proyectos = data || [];
    }
  }

  // 🛠️ MÉTODOS DE INTERFAZ
  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
  }

  // 🚀 FUNCIÓN PARA CREAR EN SUPABASE (Conectada con el HTML)
  async crearProyecto() {
    if (!this.nuevoProyecto.nombre) {
      alert("El nombre del proyecto es obligatorio.");
      return;
    }

    this.guardandoProyecto = true;

    // 1. Convertimos el texto "Angular, Supabase" en un Array ['Angular', 'Supabase']
    const stackArray = this.nuevoProyecto.stack
      ? this.nuevoProyecto.stack.split(',').map(item => item.trim()).filter(item => item.length > 0)
      : [];

    // 2. Preparamos el paquete de datos
    const proyectoAInsertar = {
      nombre: this.nuevoProyecto.nombre,
      descripcion: this.nuevoProyecto.descripcion,
      stack: stackArray,
      estado: this.nuevoProyecto.estado,
      progreso: 0 
    };

    // 3. Lo enviamos a la base de datos
    const { error } = await this.authService.supabase
      .from('proyectos')
      .insert([proyectoAInsertar]);

    this.guardandoProyecto = false;

    if (error) {
      console.error('Error al guardar:', error);
      alert('Hubo un error al crear el proyecto.');
    } else {
      // 4. Éxito: Limpiamos, cerramos el formulario y recargamos
      this.nuevoProyecto = { nombre: '', descripcion: '', stack: '', estado: 'Activo' };
      this.mostrarFormulario = false;
      await this.cargarProyectos(); 
    }
  }
}