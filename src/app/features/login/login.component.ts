import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../infra/auth.service';
import Swal from 'sweetalert2';
import { LucideAngularModule, Mail, Key, Terminal } from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // 🎨 Iconos
  readonly IconMail = Mail;
  readonly IconKey = Key;
  readonly IconTerminal = Terminal;

  public email = '';
  public password = '';
  public loading = false;

  async onLogin(event: Event) {
    event.preventDefault();
    this.loading = true;

    try {
      // Suponiendo que tu authService tiene el método login(email, password)
      const { error } = await this.authService.login(this.email, this.password);

      if (error) {
        // Alerta de error elegante
        Swal.fire({
          title: 'ACCESO DENEGADO',
          text: 'Credenciales incorrectas o usuario no registrado.',
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
        // En el login, si hay éxito, lo mejor es entrar directamente sin preguntar
        this.router.navigate(['/home']);
      }
    } finally {
      this.loading = false;
    }
  }
}