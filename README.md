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

## Publicar en GitHub Pages

1. Sube los archivos al repositorio.
2. Abre **Settings → Pages**.
3. Selecciona **Deploy from a branch**, rama `main` y carpeta `/ (root)`.

Las tarjetas de la página son conceptos de muestra, no trabajos de clientes.
