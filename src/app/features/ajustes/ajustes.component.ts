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
  MapPin,
  Link // 🔥 1. AÑADIDO: Importamos el icono Link
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
  readonly IconLink = Link; // 🔥 2. AÑADIDO: Declaramos el icono

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
  
  // 🔥 3. AÑADIDO: Variable para el input de Gogs
  public gogsUsuarioInput: string = ''; 

  // 👥 Gestión de ADMIN (Dossiers)
  listaUsuarios: any[] = [];
  dossierAbierto: any = null;

  async ngOnInit(): Promise<void> {
    const { data: { session } } = await this.authService.getSession();

    if (session) {
      this.rolUsuario = session.user.user_metadata?.['rol'] || 'JUNIOR';
      this.miIdUsuario = session.user.id;
      this.miPerfil.email = session.user.email || '';
      
      await this.cargarMiPerfil();

      if (this.rolUsuario === 'ADMIN') {
        await this.cargarListaUsuarios();
      }
    }
    this.cargando = false;
  }

  // ==========================================================
  // 1. GESTIÓN DE MI PERFIL
  // ==========================================================
  async cargarMiPerfil() {
    const { data, error } = await this.authService.supabase
      .from('perfiles')
      .select('nombre, ubicacion, bio, gogs_username') // 🔥 AÑADIDO: gogs_username
      .eq('id', this.miIdUsuario)
      .maybeSingle();

    if (data) {
      this.miPerfil.nombre = data.nombre || '';
      this.miPerfil.ubicacion = data.ubicacion || '';
      this.miPerfil.bio = data.bio || '';
      this.gogsUsuarioInput = data.gogs_username || ''; // 🔥 AÑADIDO: Cargamos el usuario si existe
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

  // 🔥 4. AÑADIDO: La función para vincular la cuenta
  async vincularCuentaGogs() {
    if (!this.gogsUsuarioInput) return;
    
    this.guardando = true;
    const { error } = await this.authService.supabase
      .from('perfiles')
      .update({ gogs_username: this.gogsUsuarioInput.trim() })
      .eq('id', this.miIdUsuario);
      
    this.guardando = false;

    if (!error) {
      Swal.fire({
        title: 'RADAR VINCULADO',
        text: 'Tu cuenta de Gogs está conectada al sistema. XP activado.',
        icon: 'success',
        background: '#0a0a0a',
        color: '#ffffff',
        confirmButtonColor: '#00e5ff',
        iconColor: '#00e5ff'
      });
    } else {
      console.error('Error al vincular Gogs:', error);
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
      this.nuevaPassword = '';
    }
  }

  async cerrarSesion() {
    await this.authService.supabase.auth.signOut();
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
      console.error('🔴 Error de Supabase:', error.message);
    } else {
      this.listaUsuarios = data || [];
    }
  }

  abrirExpediente(usuario: any) {
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
        notas_admin: this.dossierAbierto.notas_admin
      })
      .eq('id', this.dossierAbierto.id);

    this.guardando = false;

    if (error) {
      alert('Error al actualizar el expediente clasificado.');
    } else {
      alert('EXPEDIENTE ACTUALIZADO CON ÉXITO.');
      await this.cargarListaUsuarios();
      this.cerrarExpediente();
    }
  }

  async eliminarOperario() {
    Swal.fire({
      title: '⚠️ ADVERTENCIA CRÍTICA',
      text: `¿Estás seguro de que deseas ELIMINAR DEFINITIVAMENTE al operario ${this.dossierAbierto.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'SÍ, ERRADICAR',
      cancelButtonText: 'CANCELAR',
      confirmButtonColor: '#ff3b30',
      cancelButtonColor: '#333333',
      background: '#0a0a0a',
      color: '#ffffff',
      iconColor: '#ff9500',
    }).then(async (result) => {
      if (result.isConfirmed) {
        this.guardando = true;
        const { error } = await this.authService.supabase
          .rpc('eliminar_operario', { operario_id: this.dossierAbierto.id });
        this.guardando = false;

        if (error) {
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
          Swal.fire({
            title: 'SISTEMA ACTUALIZADO',
            text: 'OPERARIO ERRADICADO DEL SISTEMA.',
            icon: 'success',
            background: '#0a0a0a',
            color: '#ffffff',
            confirmButtonColor: '#00e5ff',
            iconColor: '#00e5ff'
          });
          this.cerrarExpediente(); 
          await this.cargarListaUsuarios(); 
        }
      }
    });
  }
}
// Prueba de Kanba