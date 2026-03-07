// Importaciones necesarias
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { registerAppScopedDispatcher } from '@angular/core/primitives/event-dispatch';

// 💉 El decorador Singleton debe ir inmediatamente encima de la clase
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // 🔌 1. Declaramos la propiedad privada y conectamos con la base de datos
  public supabase = createClient(environment.supabase.url, environment.supabase.key);

  // 🏗️ 2. El constructor queda limpio y vacío
  constructor() { }

  // 📝 3. Método público, ubicado a nivel de la clase
  signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }
  getSession() {
    return this.supabase.auth.getSession();
  }

async login(email: string, password: string) {
  return await this.supabase.auth.signInWithPassword({ email, password });
}

async logout() {
  return await this.supabase.auth.signOut();
}

// Actualizamos para recibir un objeto completo de metadatos
  async register(email: string, pass: string, metaData: any) {
    return await this.supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: metaData // Guarda todos los campos (nombre, dni, telefono, etc.)
      }
    });
  }

}
