# Apunto - Análisis de Documentos y Apuntes con IA

Aplicación móvil React Native que analiza documentos y apuntes de cualquier tipo usando Azure Document Intelligence (OCR) y Azure OpenAI GPT-4o (LLM) para extraer y entender información de documentos.

## Características Principales

- ✅ Análisis de **apuntes de cualquier materia** (historia, literatura, matemáticas, ciencias, arte, etc.)
- ✅ Detección de **ecuaciones y fórmulas escritas a mano** (si están presentes)
- ✅ Extracción de **conceptos principales** y temas tratados
- ✅ Identificación de **materias académicas** y áreas de conocimiento
- ✅ Análisis de documentos administrativos (facturas, recetas, citas, etc.)
- ✅ **Historial local** almacenado en el dispositivo (AsyncStorage)
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
│    (Local)      │
└────────┬────────┘
         │
         │ POST /api/analyze
         ▼
┌─────────────────┐
│   Backend API   │
│  (Node.js/      │
│   Express)      │
│                 │
│ 1. Recibe img   │
│ 2. OCR (Azure)  │
│ 3. LLM (GPT-4o) │
└────────┬────────┘
         │
         ├─────────────────┬─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐
│ Azure Document  │  │  Azure OpenAI   │  │ AsyncStorage │
│  Intelligence   │  │   (GPT-4o)      │  │  (App Local) │
│                 │  │                 │  │              │
│ - OCR           │  │ - Análisis      │  │- Historial   │
│ - Extracción    │  │ - Resumen       │  │  Local       │
│   de texto      │  │ - Etiquetas     │  │              │
│ - Ecuaciones    │  │ - Conceptos     │  │              │
│   escritas      │  │ - Entidades     │  │              │
│   a mano        │  │ - Materias      │  │              │
└─────────────────┘  └─────────────────┘  └──────────────┘
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
   - Guarda en historial local (AsyncStorage) para acceso offline

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

**Toda la lógica de conexión a servicios de Azure está en el backend:**
- El backend se conecta a **Azure Document Intelligence** para OCR
- El backend se conecta a **Azure OpenAI (GPT-4o)** para análisis de texto
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

### Almacenamiento Local (App Móvil)
- **AsyncStorage**: Almacenamiento local del historial en el dispositivo
  - El historial se guarda únicamente en el dispositivo
  - No requiere conexión a internet para acceder al historial
  - Los datos se mantienen entre sesiones de la app

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
├── app.json                   # Configuración básica de Expo
├── app.config.js              # Configuración avanzada de Expo (updates, newArch)
├── .env.example               # Ejemplo de variables de entorno
├── package.json               # Dependencias del proyecto
├── tsconfig.json              # Configuración de TypeScript
└── README.md

backend/
├── src/
│   ├── server.ts              # Servidor Express principal
│   ├── routes/
│   │   └── analyze.ts         # POST /api/analyze
│   ├── services/
│   │   ├── ocrService.ts          # Azure Document Intelligence
│   │   └── azureOpenAIService.ts  # Azure OpenAI (GPT-4o)
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

Ver `backend/env.example` y `backend/README.md` para la configuración completa del backend.

**Variables principales requeridas:**
- `AZURE_DOC_ENDPOINT`: Endpoint de Azure Document Intelligence
- `AZURE_DOC_KEY`: Clave de Azure Document Intelligence
- `AZURE_OPENAI_ENDPOINT`: Endpoint de Azure OpenAI
- `AZURE_OPENAI_KEY`: Clave de Azure OpenAI
- `AZURE_OPENAI_DEPLOYMENT`: Nombre del deployment (ej: `gpt-4o`)
- `PORT`: Puerto del servidor (default: 3000)
- `CORS_ORIGIN`: Origen permitido para CORS

### 2. App Móvil - Variables de Entorno

**IMPORTANTE**: La app móvil NO debe tener credenciales o URLs hardcodeadas. Todas las configuraciones deben estar en variables de entorno.

Crea un archivo `.env` en la carpeta `mobile-app/` basándote en `.env.example`:

```bash
cd mobile-app
cp .env.example .env
```

Edita el archivo `.env` y configura la URL del backend:

```env
# URL del backend API (REQUERIDA)
# Para desarrollo local con emulador Android: http://10.0.2.2:3000/api
# Para desarrollo local con dispositivo físico: http://TU_IP_LOCAL:3000/api
# Para producción: https://tu-backend.azurewebsites.net/api
EXPO_PUBLIC_API_URL=https://tu-backend.azurewebsites.net/api
```

**Para desarrollo:**
- **Emulador Android**: `http://10.0.2.2:3000/api`
- **Dispositivo físico**: `http://TU_IP_LOCAL:3000/api` (reemplaza `TU_IP_LOCAL` con la IP de tu máquina)
- **iOS Simulator**: `http://localhost:3000/api`

**Para producción:**
- Usa la URL completa de tu Azure App Service: `https://tu-backend.azurewebsites.net/api`

**Nota importante**: 
- Las variables de entorno en Expo deben tener el prefijo `EXPO_PUBLIC_` para ser accesibles en el código del cliente.
- Si `EXPO_PUBLIC_API_URL` no está configurada, la app lanzará un error al iniciar.
- **NUNCA** hardcodees URLs o credenciales directamente en el código.

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

# Configurar variables de entorno
cp .env.example .env
# Editar .env y configurar EXPO_PUBLIC_API_URL

npm start    # Inicia Expo Dev Server
npm run android  # Ejecuta en Android
npm run ios      # Ejecuta en iOS
```

**Nota importante**: 
- La app requiere que `EXPO_PUBLIC_API_URL` esté configurada en `.env` antes de iniciar.
- Si cambias las variables de entorno, reinicia el servidor de Expo.

### Configuración de Expo

La app está configurada con las siguientes optimizaciones para dispositivos físicos:

- **React Native New Architecture**: Deshabilitada (`newArchEnabled: false`) para compatibilidad con Android 14
- **Expo Updates**: Completamente deshabilitado para evitar problemas de sincronización
- **Permisos Android**: `INTERNET` y `ACCESS_NETWORK_STATE` configurados

Estas configuraciones están en `app.config.js` y `app.json`.

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

**Nota**: El backend solo proporciona el endpoint `/api/analyze`. El historial se gestiona completamente en la app móvil usando AsyncStorage.

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
- ✅ **Historial local** almacenado en AsyncStorage (sin sincronización con backend)
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

### Historial Local

El historial se almacena completamente en el dispositivo usando **AsyncStorage**:

- ✅ **Almacenamiento local**: Los análisis se guardan en el dispositivo
- ✅ **Acceso offline**: Puedes ver el historial sin conexión a internet
- ✅ **Persistencia**: Los datos se mantienen entre sesiones de la app
- ✅ **Privacidad**: El historial nunca se transmite al backend
- ⚠️ **Limitación**: Si desinstalas la app o limpias los datos, se perderá el historial

**Funciones disponibles:**
- Ver historial completo
- Eliminar elementos individuales
- Limpiar todo el historial

**Nota**: El historial NO se sincroniza con ningún servidor. Es completamente local al dispositivo.

### Manejo de Errores
La app detecta y muestra mensajes específicos para:
- **NO_INTERNET**: Sin conexión a internet
- **TIMEOUT**: Solicitud tardó demasiado tiempo (60s)
- **API_UNREACHABLE**: No se puede conectar con el servidor
- **ERROR_SERVER**: Error interno del servidor (500)
- **SERVICE_UNAVAILABLE**: Servicio no disponible (503)

## Seguridad

- **API keys almacenadas en variables de entorno** (backend)
- **URLs del backend en variables de entorno** (app móvil)
- **NO hardcodear credenciales o URLs** en el código
- Validación de entrada en el backend
- CORS configurado
- NO exponer API keys en el código del cliente
- Las imágenes se envían al backend, nunca directamente a servicios externos
- Service Principal para despliegue en Azure (no credenciales básicas)
- El historial se almacena localmente en el dispositivo (no se transmite al backend)

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
- `CORS_ORIGIN`
- `PORT` (opcional, default: 3000)

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
1. Configurar variables de entorno:
   - Backend: Crear `.env` en `backend/` basándote en `env.example`
   - App móvil: Crear `.env` en `mobile-app/` con `EXPO_PUBLIC_API_URL`
2. Iniciar backend: `cd backend && npm run dev`
3. Iniciar app móvil: `cd mobile-app && npm start`

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

### Error: EXPO_PUBLIC_API_URL no está configurada
- Verificar que el archivo `.env` exista en `mobile-app/`
- Verificar que `EXPO_PUBLIC_API_URL` esté definida en `.env`
- Reiniciar el servidor de Expo después de modificar `.env`
- Verificar que la URL del backend sea correcta y accesible

### Error: Imagen no se procesa
- Verificar formato de imagen (JPEG, PNG)
- Verificar tamaño máximo (10MB)
- Verificar encoding base64
- Verificar que la imagen contenga texto legible
- Azure Document Intelligence funciona muy bien con texto escrito a mano

### Error: No se puede conectar al backend
- Verificar que el backend esté corriendo
- Verificar que `EXPO_PUBLIC_API_URL` esté correctamente configurada en `.env`
- Verificar que la URL sea accesible desde tu dispositivo/emulador
- Verificar que el puerto sea correcto (3000 por defecto)
- En dispositivo físico, usar IP de la máquina, no localhost
- En emulador Android, usar `http://10.0.2.2:3000/api`
- Verificar conectividad de red
- Verificar que CORS esté configurado correctamente en el backend

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
6. ✅ Historial local con AsyncStorage (sin base de datos)
7. ✅ Manejo robusto de errores de red
8. ✅ Despliegue automatizado en Azure
9. ✅ Variables de entorno para configuración (sin hardcodeo)
10. ✅ Configuración de Expo optimizada para dispositivos físicos
11. ⏳ Testing completo end-to-end
12. ⏳ Optimización de rendimiento
13. ⏳ Autenticación de usuarios
14. ⏳ Build de producción para App Store/Google Play

## Recursos

- [Azure Document Intelligence Docs](https://learn.microsoft.com/azure/ai-services/document-intelligence)
- [Azure OpenAI Docs](https://learn.microsoft.com/azure/ai-services/openai/)
- [React Native Expo Docs](https://docs.expo.dev/)
- [Portal de Azure](https://portal.azure.com)
- [AsyncStorage Docs](https://react-native-async-storage.github.io/async-storage/)
- [Expo Application Services (EAS)](https://docs.expo.dev/eas/)

## Licencia

Proyecto de prototipo - Uso interno
