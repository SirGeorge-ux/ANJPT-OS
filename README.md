```markdown
# ⚡ ANJPT OS - Sistema de Gestión de Proyectos

**ANJPT OS** es una plataforma de gestión de tareas y proyectos diseñada con una estética _Cyberpunk/High-Tech_. Desarrollada sobre **Angular 19** y **Supabase**, permite administrar flujos de trabajo de desarrollo con roles definidos y una interfaz de alto impacto visual.

---

## 🚀 Características Principales

- **Diseño Cyberpunk:** Interfaz oscura con acentos neón basada en CSS Grid y Flexbox.
- **Gestión de Tareas:** Creación y seguimiento de tareas con estados dinámicos (Por hacer, Revisar, En progreso, Terminado)[cite: 4].
- **Control de Roles:** Diferenciación de permisos para perfiles JUNIOR, SENIOR y ADMIN.
- **Tech Stack Dinámico:** Visualización de tecnologías por proyecto mediante etiquetas (chips).
- **Backend Realtime:** Integración completa con Supabase para autenticación y base de datos.
- **🔥 NUEVO - Radar Táctico (WebSockets):** Intercepción en tiempo real de código, actualizando la terminal de comunicaciones sin necesidad de recargar la página.
- **🔥 NUEVO - Smart Commits:** Motor de automatización que detecta patrones (ej: `cierra #5`) en el control de versiones para mover tareas en el tablero Kanban automáticamente.
- **🔥 NUEVO - Gamificación Integrada:** Sistema de experiencia (XP), cálculo de rachas diarias de productividad y ranking de operarios.

## 🛠️ Tecnologías utilizadas

- **Frontend Framework:** [Angular 19](https://angular.dev/) 
- **Base de Datos, Auth & Realtime:** [Supabase](https://supabase.com/) 
- **Microservicios:** Deno 2.0 (Supabase Edge Functions)
- **Gráficos & Métricas:** Chart.js
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
* Localiza el archivo `src/environments/environment.example.ts`.
* Cámbiale el nombre a `environment.ts`.


* Introduce tu **Supabase URL** y tu **Anon Key**:


```typescript
export const environment = {
  production: false,
  supabaseUrl: "TU_URL_DE_SUPABASE",
  supabaseKey: "TU_KEY_ANON_DE_SUPABASE",
};

```


4. 
**Lanzar el servidor de desarrollo:** 


```bash
ng serve

```


Accede a `http://localhost:4200` en tu navegador.



---

## 📡 Integración con Control de Versiones (GOGS)

ANJPT OS actúa como un centro de mando interceptando la actividad de los repositorios de Gogs mediante una arquitectura de microservicios:

1. **Edge Function (Deno):** Un webhook alojado en Supabase recibe el payload de Gogs, verifica la integridad y lo inyecta de forma segura en la bóveda de datos.
2. **Motor SQL (Triggers):** PostgreSQL analiza el mensaje del commit, extrae los IDs de las tareas, asigna los puntos de experiencia (XP) al autor emparejando los usuarios y actualiza el Kanban.
3. **Broadcasting:** Supabase Realtime emite la señal al frontend en Angular para actualizar los paneles visuales al instante.

---

## 👤 Autoría

Desarrollado por **SirGeorge-ux** - *Full Stack Developer*.
Con la asistencia técnica y arquitectura de datos de **Gemini (IA)**.

```
