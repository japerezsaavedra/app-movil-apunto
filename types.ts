export enum AppState {
  CAMERA,        // Pantalla inicial: tomar foto
  DESCRIPTION,   // Pantalla: foto tomada, ingresar descripción
  RESULTS,       // Pantalla: mostrar resultados
  PROCESSING,    // Procesando envío
  HISTORY,       // Pantalla: historial de análisis
  ERROR,
}

export interface AnalysisResult {
  extractedText: string;
  summary: string;
  label: string;
  detectedInfo?: {
    entities: Array<{ type: string; value: string; confidence: string }>;
    keyPoints: string[];
    documentType: string;
    understanding: string;
  };
  tags?: string[];
}

export interface HistoryItem {
  id: string;
  imageUri: string;
  description: string;
  extractedText: string;
  summary: string;
  label: string;
  timestamp: number;
}

