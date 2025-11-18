# Apunto - Análisis de Documentos y Apuntes con IA

Aplicación móvil React Native que analiza documentos y apuntes académicos de cualquier tipo usando Google Vision API (OCR) y Google Gemini (LLM) para extraer y entender información de documentos.

## Características Principales

- ✅ Análisis de **apuntes académicos de cualquier materia** (historia, literatura, matemáticas, ciencias, arte, etc.)
- ✅ Detección de **ecuaciones y fórmulas escritas a mano** (si están presentes)
- ✅ Extracción de **conceptos principales** y temas tratados
- ✅ Identificación de **materias académicas** y áreas de conocimiento
- ✅ Análisis de documentos administrativos (facturas, recetas, citas, etc.)
- ✅ Historial local de análisis
- ✅ Interfaz intuitiva y fácil de usar

## Arquitectura del Sistema

```
┌─────────────────┐
│   App Móvil     │
│  (React Native) │
│                 │
│ 1. Tomar foto   │
│ 2. Descripción  │
└────────┬────────┘
         │
         │ POST /api/analyze
         │ { image, description }
         ▼
┌─────────────────┐
│   Backend API   │
│  (Node.js/      │
│   Express)      │
│                 │
│ 1. Recibe img   │
│ 2. OCR (Google) │
│ 3. LLM (Gemini) │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│ Google Vision   │  │  Google Gemini  │
│      API        │  │   (LLM)         │
│                 │  │                 │
│ - OCR           │  │ - Análisis      │
│ - Extracción    │  │ - Resumen       │
│   de texto      │  │ - Etiquetas     │
│ - Ecuaciones    │  │ - Conceptos     │
│   escritas      │  │ - Entidades     │
│   a mano        │  │ - Materias      │
└─────────────────┘  └─────────────────┘
```

## Flujo Completo

### 1. **App Móvil (React Native)**
   - Usuario toma foto del documento/apunte o selecciona de galería
   - Usuario ingresa descripción/contexto (ej: "Apunte de historia sobre la Revolución Francesa")
   - App convierte imagen a base64
   - App envía imagen (base64) + descripción al backend

### 2. **Backend API (Node.js/Express)**
   - Recibe imagen en formato base64 y descripción
   - Valida formato y tamaño de imagen
   - **Paso 1 - OCR**: Usa Google Vision API (o Tesseract.js) para extraer texto
     - Detecta texto escrito a mano o impreso
     - Extrae ecuaciones y fórmulas si están presentes
     - Obtiene texto completo del documento
   - **Paso 2 - Análisis**: Usa Google Gemini con:
     - Texto extraído (OCR)
     - Descripción del usuario (contexto)
   - Gemini genera análisis comprensivo:
     - Identifica el tipo de documento (apunte, factura, nota, etc.)
     - Detecta la materia o área de conocimiento (si es un apunte)
     - Extrae conceptos principales y temas tratados
     - Identifica y explica ecuaciones/fórmulas (si están presentes)
     - Extrae entidades estructuradas (fechas, nombres, conceptos, etc.)
     - Genera puntos clave del documento
     - Crea resumen comprensivo
   - Retorna resultado completo a la app móvil

### 3. **App Móvil (Resultado)**
   - Muestra etiqueta principal (ej: "Apunte de Historia")
   - Muestra todas las etiquetas secundarias (ej: ["Historia", "Revolución Francesa"])
   - Muestra tipo de documento detectado
   - Muestra información estructurada:
     - Entidades detectadas (fechas, conceptos, temas académicos, ecuaciones, etc.)
     - Puntos clave del documento
     - Comprensión del documento
   - Muestra texto extraído (OCR)
   - Muestra resumen completo
   - Guarda en historial local

## Tipos de Documentos Soportados

### Apuntes Académicos
El sistema puede analizar apuntes de **cualquier materia**:

- **Historia**: Apuntes sobre eventos históricos, fechas, personajes, etc.
- **Literatura**: Análisis de textos, autores, movimientos literarios, etc.
- **Matemáticas**: Apuntes con ecuaciones, fórmulas, teoremas, etc.
- **Ciencias**: Física, química, biología con fórmulas y conceptos
- **Arte**: Historia del arte, movimientos artísticos, etc.
- **Cualquier otra materia académica**

### Documentos Administrativos
- Facturas, recibos, comprobantes
- Recetas médicas
- Citas y agendas
- Documentos oficiales

### Notas Personales
- Recordatorios
- Listas de tareas
- Notas rápidas

## Stack Tecnológico

### Frontend (Móvil)
- **React Native** con Expo
- **TypeScript**
- **expo-image-picker**: Captura de fotos y selección de galería
- **expo-file-system**: Manejo de archivos y conversión a base64
- **AsyncStorage**: Almacenamiento local del historial

**Nota importante**: La app móvil NO se conecta directamente a servicios de Google. Solo se conecta al backend mediante API REST.

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **@google/generative-ai**: Google Gemini SDK (para análisis de texto)
- **tesseract.js**: OCR alternativo (gratis, local)
- **dotenv**: Variables de entorno
- **cors**: Configuración CORS

**Toda la lógica de conexión a servicios de Google está en el backend:**
- El backend se conecta a **Google Vision API** para OCR
- El backend se conecta a **Google Gemini** para análisis de texto
- La app móvil solo envía imágenes y recibe resultados

### Servicios Google Cloud (usados por el backend)
- **Google Vision API**: OCR y extracción de texto
  - Tier gratuito: 1,000 unidades/mes
  - Después: $1.50 por cada 1,000 unidades
  - Excelente para texto escrito a mano y ecuaciones
  - Se usa cuando `USE_GOOGLE_VISION_OCR=true` en el backend
- **Google Gemini**: LLM para análisis y comprensión
  - Tier gratuito: 60 requests/minuto, 1,500 requests/día
  - Siempre se usa para el análisis de texto
  - Capaz de analizar apuntes de cualquier materia

## Estructura del Proyecto

```
mobile-app/
├── App.tsx                    # Componente principal de la app
├── types.ts                   # Tipos TypeScript (AnalysisResult, HistoryItem, etc.)
├── services/
│   ├── apiService.ts          # Servicio para llamar al backend (única conexión externa)
│   └── historyService.ts      # Servicio para guardar/cargar historial local
├── package.json
└── README.md

backend/
├── src/
│   ├── server.ts              # Servidor Express principal
│   ├── routes/
│   │   └── analyze.ts         # Ruta POST /api/analyze
│   ├── services/
│   │   ├── ocrService.ts      # Servicio OCR (Google Vision o Tesseract.js)
│   │   └── geminiService.ts   # Servicio Google Gemini
│   └── utils/
│       └── imageConverter.ts   # Utilidades para imágenes
├── package.json
├── .env                       # Variables de entorno (no versionado)
├── env.example                # Ejemplo de variables de entorno
└── README.md
```

## Configuración

### 1. Backend - Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/`:

```env
# Google Gemini (LLM para análisis de documentos)
# Obtén tu API key en: https://aistudio.google.com/apikey
GEMINI_API_KEY=tu-gemini-api-key

# OCR: Por defecto se usa Tesseract.js (gratis, ilimitado, local)
# 
# Alternativa: Google Vision API (RECOMENDADO para apuntes escritos a mano)
# - Tier gratuito: 1,000 unidades/mes
# - Después: $1.50 por cada 1,000 unidades
# - Para usar Google Vision API, descomenta la siguiente línea:
# USE_GOOGLE_VISION_OCR=true

# Servidor
PORT=3000
CORS_ORIGIN=*
```

### 2. App Móvil - Configuración

En `services/apiService.ts`, configura la URL del backend:

```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
```

**Para desarrollo:**
- **Emulador Android**: `http://10.0.2.2:3000/api`
- **Dispositivo físico**: `http://TU_IP_LOCAL:3000/api` (reemplaza TU_IP_LOCAL con la IP de tu máquina)
- **iOS Simulator**: `http://localhost:3000/api`

**Para producción:**
```typescript
const API_BASE_URL = 'https://tu-backend.herokuapp.com/api';
```

## Instalación y Ejecución

### Backend

```bash
cd backend
npm install
npm run dev  # Desarrollo
npm start    # Producción
```

### App Móvil

```bash
cd mobile-app
npm install
npm start
```

## Endpoint del Backend

### POST `/api/analyze`

**Request:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "description": "Apunte de historia sobre la Revolución Francesa"
}
```

**Response:**
```json
{
  "extractedText": "REVOLUCIÓN FRANCESA\n1789 - 1799\nCausas principales...",
  "summary": "Apunte académico sobre la Revolución Francesa que cubre el período 1789-1799, incluyendo causas principales, eventos clave y consecuencias históricas.",
  "label": "Apunte de Historia",
  "detectedInfo": {
    "entities": [
      {"type": "tema_academico", "value": "Historia de Francia", "confidence": "alta"},
      {"type": "concepto", "value": "Revolución Francesa", "confidence": "alta"},
      {"type": "fecha", "value": "1789", "confidence": "alta"},
      {"type": "fecha", "value": "1799", "confidence": "alta"}
    ],
    "keyPoints": [
      "Revolución Francesa (1789-1799)",
      "Causas: crisis económica y social",
      "Eventos clave: Toma de la Bastilla",
      "Consecuencias: fin del Antiguo Régimen"
    ],
    "documentType": "Apunte de historia sobre la Revolución Francesa",
    "understanding": "Documento académico que trata sobre la Revolución Francesa. El usuario indicó que es un apunte de historia, lo cual coincide con el contenido detectado."
  },
  "tags": ["Apunte", "Historia", "Revolución Francesa"]
}
```

**Ejemplo con ecuaciones:**
```json
{
  "extractedText": "DERIVADAS\nf(x) = x² + 2x + 1\nf'(x) = 2x + 2...",
  "summary": "Apunte de matemáticas sobre derivadas que incluye ejemplos de funciones polinómicas y sus derivadas.",
  "label": "Apunte de Matemáticas",
  "detectedInfo": {
    "entities": [
      {"type": "tema_academico", "value": "Cálculo diferencial", "confidence": "alta"},
      {"type": "concepto", "value": "Derivadas", "confidence": "alta"},
      {"type": "ecuacion", "value": "f(x) = x² + 2x + 1", "confidence": "alta"},
      {"type": "formula", "value": "f'(x) = 2x + 2", "confidence": "alta"}
    ],
    "keyPoints": [
      "Concepto de derivada",
      "Función: f(x) = x² + 2x + 1",
      "Derivada: f'(x) = 2x + 2"
    ],
    "documentType": "Apunte de matemáticas con ecuaciones sobre derivadas"
  },
  "tags": ["Apunte", "Matemáticas", "Ecuaciones", "Derivadas"]
}
```

## Características de la App

### Funcionalidades
- ✅ Captura de fotos con cámara
- ✅ Selección de imágenes de galería
- ✅ Ingreso de descripción/contexto del documento
- ✅ Análisis completo del documento o apunte
- ✅ Visualización de información estructurada
- ✅ Historial local de análisis
- ✅ Eliminación de elementos del historial

### Información Mostrada
- **Etiqueta Principal**: Categoría principal del documento (ej: "Apunte de Historia")
- **Etiquetas Secundarias**: Etiquetas adicionales (ej: ["Historia", "Revolución Francesa"])
- **Tipo de Documento**: Identificación específica del tipo
- **Entidades Detectadas**: 
  - Fechas, montos, nombres, direcciones
  - **Temas académicos** (materias)
  - **Conceptos clave** (ideas principales)
  - **Ecuaciones y fórmulas** (si están presentes)
- **Puntos Clave**: 3-5 puntos más importantes del documento
- **Comprensión**: Explicación de lo que el LLM entendió
- **Texto Extraído**: Texto completo extraído por OCR
- **Resumen**: Resumen comprensivo del documento

## Seguridad

- API keys almacenadas en variables de entorno (backend)
- Validación de entrada en el backend
- CORS configurado
- NO exponer API keys en el código del cliente
- Las imágenes se envían al backend, nunca directamente a servicios externos

## Costos

### Google Vision API (OCR - Opcional)
- **Gratis**: 1,000 unidades/mes (primeros 1,000 documentos)
- Después: $1.50 por cada 1,000 unidades
- **Recomendado** para apuntes escritos a mano y ecuaciones

### Google Gemini (LLM)
- **Gratis**: 60 requests por minuto, 1,500 requests por día
- Después: Consulta precios en Google AI Studio

### Alternativa Gratuita (Tesseract.js)
- **Completamente gratis**: Sin límites
- Funciona localmente en el servidor
- No requiere API keys
- Configuración: `USE_GOOGLE_VISION_OCR=false` (por defecto)

## Testing

### Desarrollo Local
- Backend: `http://localhost:3000`
- App móvil: Usar emulador o dispositivo físico
- Configurar CORS para permitir conexiones desde el emulador

### Emulador Android
- URL: `http://10.0.2.2:3000/api` (localhost del host)
- O usar IP de tu máquina: `http://192.168.x.x:3000/api`

### iOS Simulator
- URL: `http://localhost:3000/api`

## Troubleshooting

### Error: CORS
- Verificar que `CORS_ORIGIN` en `.env` permita el origen de la app
- En desarrollo, usar `*` temporalmente
- Verificar que la URL del backend sea correcta en `apiService.ts`

### Error: API Key inválida
- Verificar que `GEMINI_API_KEY` en `.env` sea correcta
- Verificar que la API key tenga permisos para Vision API y Gemini

### Error: Imagen no se procesa
- Verificar formato de imagen (JPEG, PNG)
- Verificar tamaño máximo (10MB)
- Verificar encoding base64
- Verificar que la imagen contenga texto legible
- Para texto escrito a mano, usar Google Vision API para mejor precisión

### Error: No se puede conectar al backend
- Verificar que el backend esté corriendo
- Verificar la URL en `apiService.ts`
- Verificar que el puerto sea correcto (3000 por defecto)
- En dispositivo físico, usar IP de la máquina, no localhost

## Casos de Uso

### Apuntes Académicos
- Captura apuntes de clase escritos a mano
- Analiza conceptos principales y temas tratados
- Identifica la materia automáticamente
- Extrae ecuaciones y fórmulas si están presentes

### Documentos Administrativos
- Digitaliza facturas y recibos
- Extrae información estructurada (montos, fechas, etc.)
- Organiza documentos por categorías

### Notas Personales
- Digitaliza notas rápidas
- Extrae recordatorios y tareas
- Organiza información personal

## Próximos Pasos

1. ✅ Backend configurado con Google Vision OCR y Gemini
2. ✅ App móvil conectada al backend real
3. ✅ Eliminados todos los mockups
4. ✅ Soporte para apuntes de cualquier materia
5. ✅ Detección de ecuaciones escritas a mano
6. ⏳ Testing completo
7. ⏳ Optimización de rendimiento
8. ⏳ Despliegue en producción

## Recursos

- [Google Vision API Docs](https://cloud.google.com/vision/docs)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [React Native Expo Docs](https://docs.expo.dev/)
- [Tesseract.js Docs](https://tesseract.projectnaptha.com/)

## Licencia

Proyecto de prototipo - Uso interno
