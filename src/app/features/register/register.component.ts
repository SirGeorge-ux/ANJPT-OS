import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../infra/auth.service';
import Swal from 'sweetalert2';
import { 
  LucideAngularModule, User, Mail, Key, MapPin, 
  Terminal, Phone, Globe, CreditCard, Code 
} from 'lucide-angular';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // 🎨 Iconos
  readonly IconUser = User;
  readonly IconMail = Mail;
  readonly IconKey = Key;
  readonly IconMap = MapPin;
  readonly IconTerminal = Terminal;
  readonly IconPhone = Phone;
  readonly IconGlobe = Globe;
  readonly IconDni = CreditCard;
  readonly IconCode = Code;

  // 📋 Variables del formulario (Datos Oficiales)
  public nombre = '';
  public dni = '';
  public telefono = '';
  public direccion = '';
  public pais = '';
  public stack = '';
  public email = '';
  public password = '';
  
  public loading = false;

  async onRegister(event: Event) {
    event.preventDefault();
    this.loading = true;

    try {
      // Empaquetamos todos los datos extra en un objeto
      const userData = {
        nombre: this.nombre,
        dni: this.dni,
        telefono: this.telefono,
        direccion: this.direccion,
        pais: this.pais,
        stack: this.stack
      };

      // Enviamos el email, la clave y el paquete de datos
      const { error } = await this.authService.register(this.email, this.password, userData);

      if (error) {
        // Interceptamos y traducimos los errores más comunes de Supabase
        let mensajeError = error.message;
        if (mensajeError.includes('already registered')) {
          mensajeError = 'Este correo electrónico ya pertenece a un socio activo.';
        } else if (mensajeError.includes('dni_unico')) {
          mensajeError = 'Este Documento (DNI/NIE) ya está registrado en el sistema.';
        }

        Swal.fire({
          title: 'ACCESO DENEGADO',
          text: mensajeError, 
          icon: 'error',
          background: '#0a0a0a',
          color: '#ffffff',
          confirmButtonColor: '#ccff00', 
          iconColor: '#ff3b30',
          customClass: {
            confirmButton: 'btn-swal-negro'
          }
        });
      } else {
        // 👇 ESTA ES LA PIEZA CLAVE QUE FALTABA 👇
        Swal.fire({
          title: 'ALTA COMPLETADA',
          text: 'Expediente de socio creado. Bienvenido a la red.',
          icon: 'success',
          background: '#0a0a0a',
          color: '#ffffff',
          confirmButtonColor: '#ccff00',
          iconColor: '#ccff00',
          customClass: {
            confirmButton: 'btn-swal-negro'
          }
        }).then(() => {
          // Después de que el usuario pulse "OK", lo mandamos al panel principal
          this.router.navigate(['/home']);
        });
      } 
    } finally {
      this.loading = false;
    }
  }
}