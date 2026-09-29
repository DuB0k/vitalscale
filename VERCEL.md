# 🚀 Guía de Despliegue en Vercel - VitalScale

Este proyecto está 100% preconfigurado para desplegarse en **Vercel** en menos de 2 minutos sin requerir ajustes manuales de compilación.

---

## 📋 Opción 1: Despliegue con GitHub / GitLab (Recomendado)

1. **Sube tu proyecto a un repositorio de GitHub**:
   ```bash
   git init
   git add .
   git commit -m "VitalScale app lista para producción"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/vitalscale.git
   git push -u origin main
   ```

2. **Conecta con Vercel**:
   - Accede a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta.
   - Pulsa sobre **"Add New..."** > **"Project"**.
   - Selecciona tu repositorio recién creado.

3. **Configuración de Vercel (Automática gracias a `vercel.json`)**:
   - **Framework Preset**: `Vite` (detectado automáticamente).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Variables de Entorno (Opcional)**:
   Si ya tienes tu proyecto de Supabase creado, puedes añadir en la sección **"Environment Variables"**:
   - `VITE_SUPABASE_URL`: Tu URL del proyecto (ej: `https://abcdefgh.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY`: Tu clave pública anónima de Supabase.

   > 💡 **Nota:** Si no las configuras en Vercel, la aplicación seguirá funcionando de maravilla: se iniciará en modo local y podrás introducir tus claves de Supabase directamente en la aplicación haciendo clic en el botón superior **"Nube / Supabase"**.

5. Pulsa en **"Deploy"**. En unos 20 segundos tu aplicación estará publicada y disponible con certificado SSL HTTPS gratuito (ej: `https://vitalscale.vercel.app`).

---

## ⚡ Opción 2: Despliegue directo desde la terminal (Vercel CLI)

Si prefieres desplegar directamente desde tu consola sin necesidad de Git:

1. Instala Vercel CLI globalmente (si no lo tienes):
   ```bash
   npm i -g vercel
   ```

2. Ejecuta en la raíz del proyecto:
   ```bash
   vercel
   ```

3. Para desplegar directamente a producción:
   ```bash
   vercel --prod
   ```

---

## ⚙️ Archivos de configuración incluidos

- **`vercel.json`**: Configura las rutas SPA para que cualquier refresco o navegación redirija a `index.html`, además de añadir cabeceras de caché inmutable para los assets generados por Vite.
- **`.env.example`**: Plantilla con las variables de entorno de Supabase listas para documentar o copiar.
- **`.gitignore`**: Asegura que `node_modules`, `dist` y archivos `.env.local` no se suban al repositorio público.
