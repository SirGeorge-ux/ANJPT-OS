# ⚡ ANJPT OS - Sistema de Gestión de Proyectos

**ANJPT OS** es una plataforma de gestión de tareas y proyectos diseñada con una estética _Cyberpunk/High-Tech_. Desarrollada sobre **Angular 19** y **Supabase**, permite administrar flujos de trabajo de desarrollo con roles definidos y una interfaz de alto impacto visual.

---

## 🚀 Características Principales

- **Diseño Cyberpunk:** Interfaz oscura con acentos neón basada en CSS Grid y Flexbox.
- **Gestión de Tareas:** Creación y seguimiento de tareas con estados dinámicos (Por hacer, Revisar, En progreso, Terminado).
- **Control de Roles:** Diferenciación de permisos para perfiles JUNIOR, SENIOR y ADMIN.
- **Tech Stack Dinámico:** Visualización de tecnologías por proyecto mediante etiquetas (chips).
- **Backend Realtime:** Integración completa con Supabase para autenticación y base de datos.

## 🛠️ Tecnologías utilizadas

- **Framework:** [Angular 19](https://angular.dev/)
- **Base de Datos & Auth:** [Supabase](https://supabase.com/)
- **Iconografía:** [Lucide Angular](https://lucide.dev/)
- **Estilos:** CSS3 Moderno (Custom Properties & Grid)

---

## ⚙️ Configuración del Proyecto

Debido a razones de seguridad, las credenciales de la base de datos no están incluidas en el repositorio.

1. **Clonar el repositorio:**

   ```bash
   git clone [https://github.com/SirGeorge-ux/ANJPT-OS.git](https://github.com/SirGeorge-ux/ANJPT-OS.git)
   cd anjpt-os
   ```

2. **Instalar dependencias:**

```bash
npm install
```

3. **Configurar variables de entorno:**

- Localiza el archivo `src/environments/environment.example.ts`.
- Cámbiale el nombre a `environment.ts`.
- Introduce tu **Supabase URL** y tu **Anon Key**:

```bash
export const environment = {
  production: false,
  supabaseUrl: "TU_URL_DE_SUPABASE",
  supabaseKey: "TU_KEY_ANON_DE_SUPABASE",
};
```

4. **Lanzar el servidor de desarrollo:**

```bash
ng serve

```

Accede a `http://localhost:4200` en tu navegador.

---

## 👤 Autor

Desarrollado por **SirGeorge-ux** - _Full Stack Developer_
