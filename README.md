# Orion Studio

Sitio de presentación para Orion Studio, con conceptos visuales de muestra, servicios y contacto.

## Abrir localmente

Abre `index.html` en un navegador o ejecútalo con Live Server desde VS Code.

El sitio carga las tipografías de Google Fonts, las fotografías de Unsplash y Three.js para la escena 3D de portada, así que necesita conexión a internet para mostrarse completo.

## Contacto

El contacto actual abre WhatsApp al `+52 55 2257 4365` y el correo `orionwebstd@gmail.com`.

## Cambiar el color de acento

En `assets/css/styles.css`, cambia `--blue` dentro de `:root`.

## Panel de administración (CRM)

El acceso está en el footer (**ADMIN**) y vive en `admin/`. Sin configurar, muestra datos de ejemplo.

Para conectarlo a Supabase:

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, pega y ejecuta `supabase/schema.sql`.
3. En **Authentication → Users → Add user**, crea tu usuario con correo y contraseña.
4. En **Authentication → Sign In / Providers**, desactiva **Allow new users to sign up**.
5. En **SQL Editor**, date permisos de administrador:
   `insert into public.admins (user_id) select id from auth.users where email = 'TU_CORREO';`
6. En **Project Settings → API**, copia la **Project URL** y la **anon public key** a `assets/js/supabase-config.js`. Nunca uses la `service_role` key.

### Buscador de prospectos (Google Maps)

1. En Supabase, ejecuta `supabase/migrations/002_prospectos.sql` (agrega sitio web, dirección y datos de Maps a los clientes).
2. En [Google Cloud Console](https://console.cloud.google.com), crea un proyecto y activa la facturación.
3. En **APIs y servicios → Biblioteca**, habilita **Maps JavaScript API** y **Places API (New)**.
4. En **APIs y servicios → Credenciales**, crea una **clave de API** y restríngela:
   - Restricción de aplicación: **Sitios web** → `https://orionwebmx.com/*` (y `http://127.0.0.1:5500/*` para Live Server).
   - Restricción de API: solo **Maps JavaScript API** y **Places API (New)**.
5. Pega la clave en `assets/js/google-config.js`.

### Usuarios y permisos

Solo el dueño (el primer usuario) puede crear usuarios y elegir qué secciones ve cada uno, desde **Ajustes → Usuarios**.

1. En Supabase, ejecuta `supabase/migrations/006_usuarios.sql`. Marca como dueño a quien ya tenía acceso y aplica los permisos también en la base de datos (no solo en la pantalla).
2. Crear o eliminar usuarios necesita la clave maestra, que no puede ir en la página. Por eso existe la Edge Function `admin-users`: en Supabase → **Edge Functions → Deploy a new function → Via Editor**, ponle de nombre `admin-users`, pega `supabase/functions/admin-users/index.ts` y dale **Deploy**.

## Publicar en GitHub Pages

1. Sube los archivos al repositorio.
2. Abre **Settings → Pages**.
3. Selecciona **Deploy from a branch**, rama `main` y carpeta `/ (root)`.

Las tarjetas de la página son conceptos de muestra, no trabajos de clientes.
