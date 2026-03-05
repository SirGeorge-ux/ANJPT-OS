import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../infra/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  public nombre = '';
  public email = '';
  public password = '';
  public loading = false;

  async onRegister(event: Event) {
    event.preventDefault();
    this.loading = true;

    try {
      // Pasamos el nombre como metadato a Supabase
      const { error } = await this.authService.register(this.email, this.password, this.nombre);
      
      if (error) {
        alert('ERROR EN EL REGISTRO: ' + error.message);
      } else {
        alert('REGISTRO COMPLETADO. Bienvenido a ANJPT OS.');
        this.router.navigate(['/home']);
      }
    } finally {
      this.loading = false;
    }
  }
}