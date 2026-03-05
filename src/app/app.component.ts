import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../infra/auth.service'; // Asegúrate de que esta ruta sea correcta
import { LucideAngularModule, Home, CheckSquare, Layers, BarChart3, Settings, LogOut } from 'lucide-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  // IMPORTANTE: Debemos importar RouterLink y RouterLinkActive para el menú
  imports: [RouterOutlet, CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // 🛰️ Inyectamos dependencias
  public router = inject(Router);
  private authService = inject(AuthService);

  // 👤 Variables que el HTML necesita leer
  public rolUsuario: string = 'JUNIOR'; // Valor por defecto, se actualizará al cargar la sesión

  readonly HomeIcon = Home;
  readonly TaskIcon = CheckSquare;
  readonly ProjectIcon = Layers;
  readonly ChartIcon = BarChart3;
  readonly SettingsIcon = Settings;
  readonly LogOutIcon = LogOut;

  async ngOnInit() {
    await this.obtenerDatosSesion();
  }

  /**
   * Obtiene el rol real desde Supabase
   */
  async obtenerDatosSesion() {
    try {
      const { data: { session } } = await this.authService.getSession();
      if (session) {
        this.rolUsuario = session.user.user_metadata?.['rol'] || 'JUNIOR';
      }
    } catch (e) {
      console.error("Error cargando sesión", e);
    }
  }

  /**
   * Función que ejecuta el botón SALIR
   */
  async logout() {
    await this.authService.supabase.auth.signOut();
    this.router.navigate(['/login']);
  }
}