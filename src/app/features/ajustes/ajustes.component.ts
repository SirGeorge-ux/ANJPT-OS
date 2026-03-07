import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService } from '../../../infra/auth.service';
import { 
  LucideAngularModule, 
  User, 
  Shield, 
  Key, 
  Database, 
  Save, 
  XCircle,
  MapPin
} from 'lucide-angular';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './ajustes.component.html',
  styleUrls: ['./ajustes.component.css']
})

export class AjustesComponent implements OnInit {

  // 🛰️ Dependencias
  public readonly authService = inject(AuthService);

  // 🎨 Iconos
  readonly IconUser = User;
  readonly IconShield = Shield;
  readonly IconKey = Key;
  readonly IconData = Database;
  readonly IconSave = Save;
  readonly IconClose = XCircle;
  readonly IconMap = MapPin;

  // 🛡️ Estado General
  cargando: boolean = true;
  guardando: boolean = false;
  rolUsuario: string = 'JUNIOR';
  miIdUsuario: string = '';

  // 👤 Datos de Mi Perfil
  miPerfil = {
    nombre: '',
    email: '',
    ubicacion: '',
    bio: ''
  };
  nuevaPassword: string = '';

  // 👥 Gestión de ADMIN (Dossiers)
  listaUsuarios: any[] = [];
  dossierAbierto: any = null; // Guarda los datos del usuario que el Admin está inspeccionando

  async ngOnInit(): Promise<void> {
    const { data: { session } } = await this.authService.getSession();
    
    if (session) {
      this.rolUsuario = session.user.user_metadata?.['rol'] || 'JUNIOR';
      this.miIdUsuario = session.user.id;
      this.miPerfil.email = session.user.email || '';
      
      await this.cargarMiPerfil();

      // Si soy Admin, descargo la base de datos de todos los operarios
      if (this.rolUsuario === 'ADMIN') {
        await this.cargarListaUsuarios();
      }
    }
    this.cargando = false;
  }

  // ==========================================================
  // 1. GESTIÓN DE MI PERFIL (Para todos los usuarios)
  // ==========================================================
  async cargarMiPerfil() {
    const { data, error } = await this.authService.supabase
      .from('perfiles')
      .select('nombre, ubicacion, bio')
      .eq('id', this.miIdUsuario)
      .maybeSingle();

    if (data) {
      this.miPerfil.nombre = data.nombre || '';
      this.miPerfil.ubicacion = data.ubicacion || '';
      this.miPerfil.bio = data.bio || '';
    }
  }

  async guardarMiPerfil() {
    this.guardando = true;
    const { error } = await this.authService.supabase
      .from('perfiles')
      .update({
        nombre: this.miPerfil.nombre,
        ubicacion: this.miPerfil.ubicacion,
        bio: this.miPerfil.bio
      })
      .eq('id', this.miIdUsuario);

    this.guardando = false;
    
    if (error) {
      alert('Error al actualizar los datos del sistema.');
    } else {
      alert('IDENTIDAD ACTUALIZADA: Datos guardados correctamente.');
    }
  }

  async cambiarContrasena() {
    if (!this.nuevaPassword || this.nuevaPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.guardando = true;
    const { error } = await this.authService.supabase.auth.updateUser({
      password: this.nuevaPassword
    });
    this.guardando = false;

    if (error) {
      alert('Error al actualizar los protocolos de seguridad.');
    } else {
      alert('SEGURIDAD ACTUALIZADA: Contraseña cambiada con éxito.');
      this.nuevaPassword = ''; // Limpiamos el campo
    }
  }

  async cerrarSesion() {
    // Llamamos directamente al motor de autenticación de Supabase
    await this.authService.supabase.auth.signOut();
    
    // Redirigir al login para expulsar al usuario del sistema
    window.location.href = '/login'; 
  }

  // ==========================================================
  // 2. GESTIÓN DE DOSSIERS (Exclusivo para ADMIN)
  // ==========================================================
  async cargarListaUsuarios() {
    const { data, error } = await this.authService.supabase
      .from('perfiles')
      .select('id, nombre, rol, ubicacion, bio, notas_admin, ultimo_acceso')
      .order('nombre');

    if (error) {
      console.error('🔴 Error de Supabase al cargar usuarios:', error.message);
      alert('Error de base de datos. Pulsa F12 y mira la consola.');
    } else {
      this.listaUsuarios = data || [];
      console.log('🟢 Usuarios cargados:', this.listaUsuarios);
    }
  }

  // Abre la ventana modal/panel lateral con el expediente del usuario
  abrirExpediente(usuario: any) {
    // Hacemos una copia profunda para no editar la lista original hasta guardar
    this.dossierAbierto = { ...usuario }; 
  }

  cerrarExpediente() {
    this.dossierAbierto = null;
  }

  async guardarExpediente() {
    this.guardando = true;
    
    const { error } = await this.authService.supabase
      .from('perfiles')
      .update({
        rol: this.dossierAbierto.rol,
        notas_admin: this.dossierAbierto.notas_admin // Guardamos las notas secretas
      })
      .eq('id', this.dossierAbierto.id);

    this.guardando = false;

    if (error) {
      alert('Error al actualizar el expediente clasificado.');
    } else {
      alert('EXPEDIENTE ACTUALIZADO CON ÉXITO.');
      await this.cargarListaUsuarios(); // Recargamos la lista para ver los cambios
      this.cerrarExpediente(); // Cerramos el panel
    }
  }
  // ☠️ PROTOCOLO DE ERRADICACIÓN (ACTUALIZADO CON SWEETALERT2)
  async eliminarOperario() {
    // 2. Usamos SweetAlert2 para una confirmación con estilos
    Swal.fire({
      title: '⚠️ ADVERTENCIA CRÍTICA',
      text: `¿Estás seguro de que deseas ELIMINAR DEFINITIVAMENTE al operario ${this.dossierAbierto.nombre}? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'SÍ, ERRADICAR',
      cancelButtonText: 'CANCELAR',
      // Estilos cyberpunk/neón para combinar con tu app
      confirmButtonColor: '#ff3b30', // Rojo para la confirmación
      cancelButtonColor: '#333333',   // Gris oscuro para cancelar
      background: '#0a0a0a',        // Fondo negro profundo
      color: '#ffffff',             // Texto blanco
      iconColor: '#ff9500',         // Icono de advertencia naranja
      // Puedes añadir más estilos de SweetAlert2 aquí, como border, etc.
    }).then(async (result) => {
      // 3. Manejamos la respuesta de forma asíncrona
      if (result.isConfirmed) {
        this.guardando = true;

        // Disparamos la función SQL que creamos en Supabase
        const { error } = await this.authService.supabase
          .rpc('eliminar_operario', { operario_id: this.dossierAbierto.id });

        this.guardando = false;

        if (error) {
          console.error('Error al erradicar operario:', error);
          // Alerta de error con estilo oscuro y rojo
          Swal.fire({
            title: 'ERROR DEL SISTEMA',
            text: 'No se pudo eliminar al operario.',
            icon: 'error',
            background: '#0a0a0a',
            color: '#ffffff',
            confirmButtonColor: '#ff3b30',
            iconColor: '#ff3b30'
          });
        } else {
          // Alerta de éxito con estilo oscuro y cyan
          Swal.fire({
            title: 'SISTEMA ACTUALIZADO',
            text: 'OPERARIO ERRADICADO DEL SISTEMA.',
            icon: 'success',
            background: '#0a0a0a',
            color: '#ffffff',
            confirmButtonColor: '#00e5ff', // Botón cyan neón
            iconColor: '#00e5ff'           // Tick verde/cyan
          });
          this.cerrarExpediente(); 
          await this.cargarListaUsuarios(); 
        }
      }
    });
  }
}
