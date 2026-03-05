import { Routes } from '@angular/router';
import { authGuard } from '../infra/guards/auth.guard';
import { LoginComponent } from './features/login/login.component';
import { RegisterComponent } from './features/register/register.component';
import { MisTareasComponent } from './features/mis-tareas/mis-tareas.component';
import { ProyectosComponent } from './features/proyectos/proyectos.component';
import { AdminComponent } from './features/admin/admin.component';
import { MetricasComponent } from './features/metricas/metricas.component';
import { AjustesComponent } from './features/ajustes/ajustes.component';
import { ProyectoDetalleComponent } from './features/proyecto-detalle/proyecto-detalle.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent }, 
  { path: 'register', component: RegisterComponent }, 
  { 
    path: 'home', 
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    canActivate: [authGuard]
  },
  { path: 'mis-tareas', component: MisTareasComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard] },
  { path: 'proyectos', component: ProyectosComponent, canActivate: [authGuard] },
  { path: 'proyectos/:id', component: ProyectoDetalleComponent, canActivate: [authGuard] },
  { path: 'metricas', component: MetricasComponent, canActivate: [authGuard] },
  { path: 'ajustes', component: AjustesComponent, canActivate: [authGuard] }
];