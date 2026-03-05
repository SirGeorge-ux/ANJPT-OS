import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../infra/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  public email = '';
  public password = '';
  public loading = false;

  async onLogin(event: Event) {
    event.preventDefault();
    this.loading = true;

    try {
      const { error } = await this.authService.login(this.email, this.password);
      if (error) {
        alert('ERROR DE AUTENTICACIÓN: ' + error.message);
      } else {
        this.router.navigate(['/home']);
      }
    } finally {
      this.loading = false;
    }
  }
}