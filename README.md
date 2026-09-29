# VitalScale ⚖️

> Aplicación web moderna para el seguimiento y análisis de medidas corporales (peso, contorno de cintura) y cálculo automático del Índice de Masa Corporal (IMC) con gráficas interactivas y persistencia híbrida en la nube con Supabase.

---

## 🌟 Características Principales

### 1. Gestión de Perfil y Medidas Corporales
- **Configuración de Altura (cm):** Permite fijar tu estatura para el cálculo automático y preciso del IMC ($IMC = \text{peso} / \text{estatura}^2$).
- **Objetivos personalizados:** Establece metas de peso y cintura para visualizar en las gráficas con líneas de referencia.
- **Selector de Fechas Flexible e Interactivo:**
  - Despliegue del calendario nativo al hacer clic en cualquier parte del selector o icono.
  - Botones rápidos de selección: **"Hoy"**, **"Ayer"**, **"Hace 2 días"**, **"Hace 1 sem."**.
  - Flechas de desplazamiento rápido para retroceder o avanzar de día en día (`-1` / `+1`).
  - Posibilidad de teclear el número manualmente si se prefiere.
  - Indicador legible con fecha en texto amigable (ej: *29 de septiembre de 2026*).
- **Formulario de Registro con Ajustes Finos:**
  - Peso en kg con botones de ajuste rápido (+/- 0.5 kg).
  - Cintura en cm con botones de ajuste rápido (+/- 0.5 cm).
  - Notas u observaciones contextuales (en ayunas, post-entreno, etc.).
- **Cálculo de IMC en Vivo:** A medida que tecleas tus valores, el sistema calcula tu IMC en tiempo real e indica tu categoría según la OMS:
  - 🔵 **Bajo peso** (< 18.5)
  - 🟢 **Peso normal / Saludable** (18.5 - 24.9)
  - 🟡 **Sobrepeso** (25.0 - 29.9)
  - 🔴 **Obesidad** (≥ 30.0)
- **Indicador Visual de Rango Saludable:** Conoce los kilos mínimos y máximos recomendados para tu estatura exacta.
- **Relación Cintura/Altura (ICT):** Indicador cardiovascular complementario (saludable < 0.50).

### 2. Visualización, Analítica y Edición
- **Dos Gráficas Temporales Independientes (Recharts):**
  - **Evolución del Peso vs. Tiempo (kg):** Curva suave con gradiente esmeralda/teal, tooltips con variación respecto al registro anterior e IMC del día.
  - **Evolución de la Cintura vs. Tiempo (cm):** Curva suave con gradiente cian/azul y tooltips contextuales.
- **Filtros Temporales:** Visualiza "Todo el histórico", "Últimos 30 días", "Últimos 90 días" o "Este año".
- **Tabla Histórica Completa con Edición y Eliminación:**
  - **✏️ Edición de Registros:** Pulsa el icono de lápiz en cualquier fila para corregir la fecha, el peso, la cintura o las notas con recálculo automático del IMC.
  - **🗑️ Eliminación segura:** Confirmación en dos pasos para evitar borrados accidentales.
  - Búsqueda en tiempo real por fecha, notas o categoría.
  - Ordenación por fecha más reciente/antigua y por mayor/menor peso.
  - Cálculo automático de variación ($\pm \Delta$) entre mediciones consecutivas.

### 3. Exportación y Persistencia en la Nube
- **Exportación a CSV:** Descarga con un solo clic tu historial completo en un archivo CSV formateado con UTF-8 BOM para compatibilidad directa con Microsoft Excel y Google Sheets.
- **Importación desde CSV:** Carga históricos previos en formato CSV.
- **Modo Híbrido & Supabase:**
  - Funciona de forma inmediata en local sin necesidad de configuración previa.
  - Integra Supabase para sincronización entre dispositivos introduciendo la URL y el API Key en el modal de la app o a través de variables de entorno `.env`.
  - Incluye script SQL de configuración rápida (1-clic) para crear las tablas `profiles` y `body_measurements` con seguridad RLS.

---

## 🛠️ Stack Tecnológico

- **Frontend:** React 19 + Vite
- **Estilos:** Tailwind CSS v3 + Paleta personalizada moderna (Dark Mode prioritario)
- **Gráficas:** Recharts
- **Iconografía:** Lucide React
- **Efectos:** Canvas Confetti (celebración al registrar metas)
- **Base de Datos & Auth:** Supabase (`@supabase/supabase-js`)
- **Hosting:** Optimizado para Vercel con `vercel.json`

---

## 🚀 Puesta en Marcha Local

1. Instala las dependencias:
```bash
npm install
```

2. Inicia el servidor de desarrollo:
```bash
npm run dev
```

3. Abre en tu navegador la dirección local indicada por Vite (habitualmente `http://localhost:5173`).

---

## ☁️ Despliegue en Vercel

El proyecto incluye el archivo de configuración `vercel.json` preparado para Vercel.

Consulta la guía detallada paso a paso en [VERCEL.md](file:///c:/Users/T151709/OneDrive%20-%20Telefonica/Personal/Proyectos/Pesos/VERCEL.md).
