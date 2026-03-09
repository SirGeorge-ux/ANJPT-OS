import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../infra/auth.service';
import { ProyectosService } from '../../../infra/proyectos.service';
import { Proyecto } from '../../domain/models/types';
import { LucideAngularModule, Plus, Folder, Clock, Trash2, Power } from 'lucide-angular';

@Component({
  selector: 'app-proyectos',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterModule],
  templateUrl: './proyectos.component.html',
  styleUrl: './proyectos.component.css'
})
export class ProyectosComponent implements OnInit {
  private authService = inject(AuthService);
  private proyectosService = inject(ProyectosService);

  // 🎨 Iconos UI
  readonly IconPlus = Plus;
  readonly IconFolder = Folder;
  readonly IconClock = Clock;
  readonly IconTrash = Trash2;
  readonly IconPower = Power;

  public userId: string = '';
  public rolUsuario: string = ''; // 🔥 AQUÍ GUARDAREMOS EL ROL
  public proyectos: Proyecto[] = [];
  public cargando: boolean = true;

  public mostrarModal: boolean = false;
  public enviando: boolean = false;
  public nuevoProyecto = { nombre: '', descripcion: '' };

  public mostrarModalPurgar: boolean = false;
  public proyectoAPurgar: Proyecto | null = null;

  async ngOnInit() {
    const { data: { session } } = await this.authService.getSession();
    if (session) {
      this.userId = session.user.id;
      
      // 🕵️‍♂️ Desciframos el rol del usuario actual
      const { data: perfil } = await this.authService.supabase
        .from('perfiles')
        .select('rol')
        .eq('id', this.userId)
        .single();
        
      if (perfil) {
        this.rolUsuario = perfil.rol;
      }

      await this.cargarProyectos();
    }
  }

  async cargarProyectos() {
    this.cargando = true;
    try {
      this.proyectos = await this.proyectosService.getProyectos();
    } catch (error) {
      console.error('Error al descargar proyectos:', error);
    } finally {
      this.cargando = false;
    }
  }

  abrirModal() { this.mostrarModal = true; }
  cerrarModal() { this.mostrarModal = false; this.nuevoProyecto = { nombre: '', descripcion: '' }; }

  async crearProyecto() {
    if (!this.nuevoProyecto.nombre.trim()) return;
    this.enviando = true;
    try {
      await this.proyectosService.addProyecto(this.nuevoProyecto.nombre, this.nuevoProyecto.descripcion, this.userId);
      await this.cargarProyectos(); 
      this.cerrarModal();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Hubo un error al registrar el proyecto.');
    } finally {
      this.enviando = false;
    }
  }

  // ⚡ CAMBIAR ESTADO
  async toggleEstado(proyecto: Proyecto, event: Event) {
    event.stopPropagation(); // Evita que se abra el enlace al hacer clic en el botón
    const nuevoEstado = proyecto.estado === 'ACTIVO' ? 'DESACTIVADO' : 'ACTIVO';
    
    try {
      await this.proyectosService.updateEstadoProyecto(proyecto.id!, nuevoEstado);
      proyecto.estado = nuevoEstado; // Actualizamos la vista al instante
    } catch (error) {
      console.error('Error al cambiar estado', error);
      alert('No tienes permisos para editar este proyecto.');
    }
  }

  // 🗑️ BORRAR PROYECTO (Solo ADMIN)
  async borrarProyecto(proyecto: Proyecto, event: Event) {
    event.stopPropagation();
    this.proyectoAPurgar = proyecto;
    this.mostrarModalPurgar = true; // Abrimos nuestro modal rojo
  }
  // ❌ CANCELAR PURGA
  cancelarPurga() {
    this.mostrarModalPurgar = false;
    this.proyectoAPurgar = null;
  }

  // ⚠️ EJECUTAR PURGA DEFINITIVA
  async confirmarPurga() {
    if (!this.proyectoAPurgar) return;

    try {
      await this.proyectosService.deleteProyecto(this.proyectoAPurgar.id!);
      this.proyectos = this.proyectos.filter(p => p.id !== this.proyectoAPurgar!.id);
      this.cancelarPurga(); // Cerramos el modal tras el éxito
    } catch (error) {
      console.error('Error al borrar', error);
      alert('Operación denegada: Privilegios insuficientes.');
    }
  }
}