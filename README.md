# Apunto - Análisis de Documentos y Apuntes con IA

Aplicación móvil React Native que analiza documentos y apuntes de cualquier tipo usando Azure Document Intelligence (OCR) y Azure OpenAI GPT-4o (LLM) para extraer y entender información de documentos.

## Características Principales

- ✅ Análisis de **apuntes de cualquier materia** (historia, literatura, matemáticas, ciencias, arte, etc.)
- ✅ Detección de **ecuaciones y fórmulas escritas a mano** (si están presentes)
- ✅ Extracción de **conceptos principales** y temas tratados
- ✅ Identificación de **materias académicas** y áreas de conocimiento
- ✅ Análisis de documentos administrativos (facturas, recetas, citas, etc.)
- ✅ **Historial persistente** con sincronización backend (PostgreSQL)
- ✅ **Detección de conectividad** y manejo robusto de errores de red
- ✅ Interfaz intuitiva y fácil de usar con splash screen

## Arquitectura del Sistema

```
┌─────────────────┐
│   App Móvil     │
│  (React Native) │
│                 │
│ 1. Tomar foto   │
│ 2. Descripción  │
│ 3. Historial    │
└────────┬────────┘
         │
         │ POST /api/analyze
         │ GET /api/history
         │ DELETE /api/history/:id
         ▼
┌─────────────────┐
│   Backend API   │
│  (Node.js/      │
│   Express)      │
│                 │
│ 1. Recibe img   │
│ 2. OCR (Azure)  │
│ 3. LLM (GPT-4o) │
│ 4. PostgreSQL   │
└────────┬────────┘
         │
         ├─────────────────┬─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────────┐  ┌─────────────────┐  ┌──────────┐
│ Azure Document  │  │  Azure OpenAI   │  │PostgreSQL│
│  Intelligence   │  │   (GPT-4o)      │  │ Database │
│                 │  │                 │  │          │
│ - OCR           │  │ - Análisis      │  │- History │
│ - Extracción    │  │ - Resumen       │  │- Users   │
│   de texto      │  │ - Etiquetas     │  │          │
│ - Ecuaciones    │  │ - Conceptos     │  │          │
│   escritas      │  │ - Entidades     │  │          │
│   a mano        │  │ - Materias      │  │          │
└─────────────────┘  └─────────────────┘  └──────────┘
```

## Flujo Completo

### 1. **App Móvil (React Native)**
   - Usuario toma foto del documento/apunte o selecciona de galería
   - Usuario ingresa descripción/contexto (ej: "Apunte de historia sobre la Revolución Francesa")
   - App convierte imagen a base64
   - App verifica conectividad de red antes de enviar
   - App envía imagen (base64) + descripción al backend

### 2. **Backend API (Node.js/Express)**
   - Recibe imagen en formato base64 y descripción
   - Valida formato y tamaño de imagen
   - **Paso 1 - OCR**: Usa Azure Document Intelligence para extraer texto
     - Detecta texto escrito a mano o impreso
     - Extrae ecuaciones y fórmulas si están presentes
     - Obtiene texto completo del documento
   - **Paso 2 - Análisis**: Usa Azure OpenAI (GPT-4o) con:
     - Texto extraído (OCR)
     - Descripción del usuario (contexto)
   - GPT-4o genera análisis comprensivo:
     - Identifica el tipo de documento (apunte, factura, nota, etc.)
     - Detecta la materia o área de conocimiento (si es un apunte)
     - Extrae conceptos principales y temas tratados
     - Identifica y explica ecuaciones/fórmulas (si están presentes)
     - Extrae entidades estructuradas (fechas, nombres, conceptos, etc.)
     - Genera puntos clave del documento
     - Crea resumen comprensivo
   - **Paso 3 - Persistencia**: Guarda el análisis en PostgreSQL
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
   - Guarda en historial local (AsyncStorage) como respaldo
   - Sincroniza con backend para historial persistente

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
- **React Native** 0.76.9 con Expo ~52.0.0
- **TypeScript** ~5.3.3
- **expo-image-picker** ~16.0.0: Captura de fotos y selección de galería
- **expo-file-system** ~18.0.0: Manejo de archivos y conversión a base64
- **@react-native-async-storage/async-storage** 1.23.1: Almacenamiento local del historial
- **@react-native-community/netinfo** ^11.4.1: Detección de conectividad de red
- **@expo/vector-icons** ^15.0.3: Iconos Material Icons

**Nota importante**: La app móvil NO se conecta directamente a servicios de Azure. Solo se conecta al backend mediante API REST.

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **dotenv**: Variables de entorno
- **cors**: Configuración CORS
- **pg**: Cliente PostgreSQL para persistencia de datos
- **multer**: Manejo de uploads de imágenes

**Toda la lógica de conexión a servicios de Azure está en el backend:**
- El backend se conecta a **Azure Document Intelligence** para OCR
- El backend se conecta a **Azure OpenAI (GPT-4o)** para análisis de texto
- El backend gestiona la persistencia en **PostgreSQL**
- La app móvil solo envía imágenes y recibe resultados

### Servicios Azure (usados por el backend)
- **Azure Document Intelligence**: OCR y extracción de texto
  - Modelo: prebuilt-read, API version 2023-07-31
  - Excelente para texto escrito a mano y ecuaciones
  - Procesamiento asíncrono con polling
  - Región recomendada: East US 2
- **Azure OpenAI (GPT-4o)**: LLM para análisis y comprensión
  - Desplegado via Azure AI Foundry
  - Endpoint: services.ai.azure.com
  - Siempre se usa para el análisis de texto
  - Capaz de analizar apuntes de cualquier materia
  - Respuestas siempre en español

### Base de Datos
- **PostgreSQL**: Almacenamiento persistente del historial
  - Tablas: `users`, `analysis_history`
  - Soporte para conexiones cloud (Supabase, Neon, etc.)
  - SSL habilitado para producción

## Estructura del Proyecto

```
mobile-app/
├── App.tsx                    # Componente principal con navegación y estados
├── types.ts                   # Tipos TypeScript (AnalysisResult, HistoryItem, AppState)
├── services/
│   ├── apiService.ts          # Servicio API con manejo de errores de red
│   │                          # - analyzeDocument()
│   └── historyService.ts      # Servicio de historial local (AsyncStorage)
│   │                          # - saveToHistory()
│   │                          # - getHistory()
│   │                          # - deleteHistoryItem()
│   │                          # - clearHistory()
├── main_logo.png              # Logo de la aplicación
├── app.json                   # Configuración de Expo
├── package.json               # Dependencias del proyecto
├── tsconfig.json              # Configuración de TypeScript
└── README.md

backend/
├── src/
│   ├── server.ts              # Servidor Express principal
│   ├── routes/
│   │   ├── analyze.ts         # POST /api/analyze
│   │   └── history.ts         # GET /api/history, DELETE /api/history/:id
│   ├── services/
│   │   ├── ocrService.ts          # Azure Document Intelligence
│   │   ├── azureOpenAIService.ts  # Azure OpenAI (GPT-4o)
│   │   ├── database.ts            # Conexión a PostgreSQL
│   │   └── historyService.ts      # CRUD de historial en DB
│   └── utils/
│       └── imageConverter.ts   # Utilidades para imágenes
├── package.json
├── .env                       # Variables de entorno (no versionado)
├── env.example                # Ejemplo de variables de entorno
├── DEPLOY.md                  # Guía de despliegue en Azure
└── README.md
```

## Configuración

### 1. Backend - Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/`:

```env
# Azure Document Intelligence (OCR)
# Región recomendada: East US 2 (compatible con suscripciones Student)
AZURE_DOC_ENDPOINT=https://tu-instancia.cognitiveservices.azure.com/
AZURE_DOC_KEY=tu-clave-de-document-intelligence

# Azure OpenAI (LLM - GPT-4o via Foundry)
# Región recomendada: East US 2 (compatible con suscripciones Student)
AZURE_OPENAI_ENDPOINT=https://tu-instancia.services.ai.azure.com/
AZURE_OPENAI_KEY=tu-clave-de-openai
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# PostgreSQL Database (para historial)
# Formato: postgresql://usuario:password@host:puerto/database
DATABASE_URL=postgresql://usuario:password@host:puerto/database
DATABASE_SSL=false  # true para conexiones cloud (Supabase, Neon, etc.)

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
const API_BASE_URL = 'https://apunto-backend.azurewebsites.net/api';
```

## Instalación y Ejecución

### Backend

```bash
cd backend
npm install
npm run dev  # Desarrollo con tsx watch
npm run build  # Compilar TypeScript
npm start    # Producción (requiere build previo)
```

### App Móvil

```bash
cd mobile-app
npm install
npm start    # Inicia Expo Dev Server
npm run android  # Ejecuta en Android
npm run ios      # Ejecuta en iOS
```

## API Endpoints del Backend

### POST `/api/analyze`

Analiza un documento usando OCR y LLM.

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

### GET `/api/history`

Obtiene el historial de análisis del usuario.

**Headers:**
- `x-user-id` (opcional): ID del usuario

**Query Parameters:**
- `limit` (opcional, default: 50): Número de resultados
- `offset` (opcional, default: 0): Offset para paginación

**Response:**
```json
{
  "history": [
    {
      "id": "123",
      "imageUri": "...",
      "description": "Apunte de historia",
      "extractedText": "...",
      "summary": "...",
      "label": "Apunte de Historia",
      "timestamp": "2024-11-25T19:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1
  }
}
```

### DELETE `/api/history/:id`

Elimina un elemento del historial.

**Headers:**
- `x-user-id` (opcional): ID del usuario

**Response:**
```json
{
  "message": "Análisis eliminado correctamente"
}
```

## Características de la App

### Funcionalidades
- ✅ **Splash Screen** con logo y animación de carga
- ✅ Captura de fotos con cámara (con fallback a galería)
- ✅ Selección de imágenes de galería
- ✅ Ingreso de descripción/contexto del documento
- ✅ **Detección de conectividad** antes de enviar solicitudes
- ✅ **Manejo robusto de errores** de red (timeout, sin internet, servidor no disponible)
- ✅ Análisis completo del documento o apunte
- ✅ Visualización de información estructurada
- ✅ **Historial persistente** sincronizado con backend
- ✅ **Historial local** como respaldo (AsyncStorage)
- ✅ Eliminación de elementos del historial
- ✅ **Navegación inferior** (Bottom Navigation) entre Inicio e Historial

### Estados de la App
- **CAMERA**: Pantalla inicial para capturar/seleccionar imagen
- **DESCRIPTION**: Ingreso de descripción del documento
- **PROCESSING**: Procesamiento con indicador de carga
- **RESULTS**: Visualización de resultados del análisis
- **HISTORY**: Listado del historial de análisis
- **ERROR**: Pantalla de error con opciones de reintento

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

### Manejo de Errores
La app detecta y muestra mensajes específicos para:
- **NO_INTERNET**: Sin conexión a internet
- **TIMEOUT**: Solicitud tardó demasiado tiempo (60s)
- **API_UNREACHABLE**: No se puede conectar con el servidor
- **ERROR_SERVER**: Error interno del servidor (500)
- **SERVICE_UNAVAILABLE**: Servicio no disponible (503)

## Seguridad

- API keys almacenadas en variables de entorno (backend)
- Validación de entrada en el backend
- CORS configurado
- NO exponer API keys en el código del cliente
- Las imágenes se envían al backend, nunca directamente a servicios externos
- Conexión SSL a PostgreSQL en producción
- Service Principal para despliegue en Azure (no credenciales básicas)

## Despliegue

### Backend en Azure App Service

El backend se puede desplegar en Azure App Service usando GitHub Actions. Ver `backend/DEPLOY.md` para instrucciones detalladas.

**Pasos principales:**
1. Crear App Service en Azure (Node.js 20 LTS)
2. Crear Service Principal para GitHub Actions
3. Configurar GitHub Secrets (`AZURE_CREDENTIALS`)
4. Configurar variables de entorno en Azure Portal
5. Push a `main` o `master` activa el despliegue automático

**Variables de entorno requeridas en Azure:**
- `AZURE_DOC_ENDPOINT`
- `AZURE_DOC_KEY`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_KEY`
- `AZURE_OPENAI_DEPLOYMENT`
- `DATABASE_URL`
- `DATABASE_SSL=true`
- `CORS_ORIGIN`

### App Móvil

La app móvil se puede distribuir mediante:
- **Expo Go**: Para testing rápido
- **EAS Build**: Para builds de producción (iOS/Android)
- **App Store / Google Play**: Distribución pública

## Costos

### Azure Document Intelligence (OCR)
- **Tier gratuito**: Consulta los límites actuales en Azure
- Después: Consulta precios en el [Portal de Azure](https://azure.microsoft.com/pricing/details/ai-document-intelligence/)
- Región recomendada: **East US 2** (compatible con suscripciones Student)
- **Recomendado** para apuntes escritos a mano y ecuaciones

### Azure OpenAI (GPT-4o)
- **Suscripción Student**: Créditos gratuitos disponibles
- Después: Consulta precios en el [Portal de Azure](https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/)
- Región recomendada: **East US 2** (compatible con suscripciones Student)

### PostgreSQL
- **Supabase**: Tier gratuito disponible
- **Neon**: Tier gratuito disponible
- **Azure Database for PostgreSQL**: Consulta precios

## Testing

### Desarrollo Local
1. Iniciar backend: `cd backend && npm run dev`
2. Iniciar app móvil: `cd mobile-app && npm start`
3. Configurar URL del backend en `apiService.ts`

### Emulador Android
- URL: `http://10.0.2.2:3000/api` (localhost del host)
- O usar IP de tu máquina: `http://192.168.x.x:3000/api`

### iOS Simulator
- URL: `http://localhost:3000/api`

### Dispositivo Físico
- Asegúrate de estar en la misma red que tu máquina
- Usa la IP local de tu máquina: `http://192.168.x.x:3000/api`

## Troubleshooting

### Error: CORS
- Verificar que `CORS_ORIGIN` en `.env` permita el origen de la app
- En desarrollo, usar `*` temporalmente
- Verificar que la URL del backend sea correcta en `apiService.ts`

### Error: Credenciales de Azure inválidas
- Verificar que `AZURE_DOC_ENDPOINT` y `AZURE_DOC_KEY` estén configurados
- Verificar que `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_KEY` y `AZURE_OPENAI_DEPLOYMENT` estén configurados
- Verificar que las credenciales sean válidas en el Portal de Azure

### Error: Database connection failed
- Verificar que `DATABASE_URL` esté correctamente configurado
- Asegúrate de que `DATABASE_SSL=true` para conexiones cloud
- Verificar que el firewall de PostgreSQL permita conexiones desde tu IP/Azure

### Error: Imagen no se procesa
- Verificar formato de imagen (JPEG, PNG)
- Verificar tamaño máximo (10MB)
- Verificar encoding base64
- Verificar que la imagen contenga texto legible
- Azure Document Intelligence funciona muy bien con texto escrito a mano

### Error: No se puede conectar al backend
- Verificar que el backend esté corriendo
- Verificar la URL en `apiService.ts`
- Verificar que el puerto sea correcto (3000 por defecto)
- En dispositivo físico, usar IP de la máquina, no localhost
- Verificar conectividad de red

### Error: Timeout
- Verificar conexión a internet
- El timeout está configurado a 60 segundos para análisis
- Imágenes muy grandes pueden tardar más en procesarse

## Casos de Uso

### Apuntes Académicos
- Captura apuntes de clase escritos a mano
- Analiza conceptos principales y temas tratados
- Identifica la materia automáticamente
- Extrae ecuaciones y fórmulas si están presentes
- Guarda en historial para consulta posterior

### Documentos Administrativos
- Digitaliza facturas y recibos
- Extrae información estructurada (montos, fechas, etc.)
- Organiza documentos por categorías
- Mantiene historial de documentos procesados

### Notas Personales
- Digitaliza notas rápidas
- Extrae recordatorios y tareas
- Organiza información personal
- Acceso rápido desde el historial

## Próximos Pasos

1. ✅ Backend configurado con Azure Document Intelligence y Azure OpenAI
2. ✅ App móvil conectada al backend real
3. ✅ Eliminados todos los mockups
4. ✅ Soporte para apuntes de cualquier materia
5. ✅ Detección de ecuaciones escritas a mano
6. ✅ Historial persistente con PostgreSQL
7. ✅ Manejo robusto de errores de red
8. ✅ Despliegue automatizado en Azure
9. ⏳ Testing completo end-to-end
10. ⏳ Optimización de rendimiento
11. ⏳ Autenticación de usuarios
12. ⏳ Build de producción para App Store/Google Play

## Recursos

- [Azure Document Intelligence Docs](https://learn.microsoft.com/azure/ai-services/document-intelligence)
- [Azure OpenAI Docs](https://learn.microsoft.com/azure/ai-services/openai/)
- [React Native Expo Docs](https://docs.expo.dev/)
- [Portal de Azure](https://portal.azure.com)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Expo Application Services (EAS)](https://docs.expo.dev/eas/)

## Licencia

Proyecto de prototipo - Uso interno
