import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // 👈 1. Importamos la caja de herramientas
import { AuthService } from '../../../infra/auth.service';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink], // 👈 2. La añadimos a los imports
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);

  // Variables dinámicas para el HTML
  nombreUsuario: string = 'Usuario';
  
  metricas = {
    total: 0,
    enProgreso: 0,
    completadas: 0,
    productividad: 0
  };

  tareasPrioritarias: any[] = [];

  // 🚀 AÑADE ESTE BLOQUE AQUÍ: Feed de actividad dinámico e inteligente
  actividadesRecientes = [
    { texto: 'Has iniciado sesión como Admin', tiempo: 'Hace 2 min', ruta: '/ajustes' },
    { texto: 'Moviste una tarea a "Terminado"', tiempo: 'Hace 1 hora', ruta: '/mis-tareas' },
    { texto: '¡Racha de 2 días de productividad!', tiempo: 'Ayer', ruta: '/metricas' }
  ];

  async ngOnInit() {
    // 1. Descubrimos quién es el usuario logueado
    const { data: { session } } = await this.authService.getSession();
    
    if (session) {
      // Sacamos tu nombre real (el que inyectamos por SQL) o usamos tu email de respaldo
      this.nombreUsuario = session.user.user_metadata?.['name'] || session.user.email?.split('@')[0] || 'Admin';
      
      // 2. Cargamos los datos de este usuario en concreto
      await this.cargarDatosDashboard(session.user.id);
    }
  }

  // 🚀 FUNCIÓN QUE CALCULA TODO EN TIEMPO REAL
  async cargarDatosDashboard(userId: string) {
    // Pedimos TODAS las tareas asignadas a ti
    const { data, error } = await this.authService.supabase
      .from('tareas')
      .select('*')
      .eq('asignado_a', userId);

    if (error) {
      console.error('Error al cargar dashboard:', error);
      return;
    }

    if (data) {
      // 🧮 Calculamos los números usando filtros
      this.metricas.total = data.length;
      this.metricas.enProgreso = data.filter(t => t.estado === 'En progreso').length;
      this.metricas.completadas = data.filter(t => t.estado === 'Terminado').length;
      
      // Calculamos el % de productividad (evitando dividir por cero)
      if (this.metricas.total > 0) {
        this.metricas.productividad = Math.round((this.metricas.completadas / this.metricas.total) * 100);
      }

      // 📌 Filtramos las tareas para mostrar solo las que NO están terminadas (máximo 3)
      this.tareasPrioritarias = data
        .filter(t => t.estado !== 'Terminado')
        .slice(0, 3);
    }
  }
}