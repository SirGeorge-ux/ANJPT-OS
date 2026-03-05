import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = async (route, state) => {
// 1. ¿Cómo crearías la constante authService usando inject()?
  const authService = inject(AuthService);
  // 2. ¿Cómo crearías la constante router usando inject()?
  const router = inject(Router);

  // ... (En el siguiente paso añadiremos la lógica de la sesión)
  const { data: { session } } = await authService.getSession();
  if (session) {
    return true; // El usuario está autenticado, permite el acceso
  } else {
    // El usuario no está autenticado, redirige a la página de inicio de sesión y devuelve false para bloquear el acceso
    router.navigate(['/login']);
    return false;
  }
};


