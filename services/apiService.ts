import * as FileSystem from 'expo-file-system';
import NetInfo from '@react-native-community/netinfo';
import { AnalysisResult } from '../types';

// URL del backend - ajustar según el entorno
// Para desarrollo local con emulador Android: http://10.0.2.2:3000
// Para desarrollo local con dispositivo físico: http://TU_IP_LOCAL:3000
// Para producción: https://tu-backend.azurewebsites.net
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Verifica si hay conexión a internet
 */
const checkNetworkConnection = async (): Promise<void> => {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    throw new Error('NO_INTERNET');
  }
  if (netInfo.isConnected && netInfo.type === 'none') {
    throw new Error('NO_INTERNET');
  }
};

/**
 * Detecta el tipo de error de red
 */
const getNetworkErrorMessage = (error: unknown): string => {
  if (error instanceof TypeError) {
    // Errores de red comunes
    if (error.message.includes('Network request failed') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')) {
      return 'NO_INTERNET';
    }
    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      return 'TIMEOUT';
    }
  }
  
  if (error instanceof Error) {
    if (error.message === 'NO_INTERNET') {
      return 'NO_INTERNET';
    }
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connection refused')) {
      return 'API_UNREACHABLE';
    }
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      return 'API_UNREACHABLE';
    }
  }
  
  return 'UNKNOWN';
};

/**
 * Convierte una URI de imagen local a base64
 */
const imageUriToBase64 = async (uri: string): Promise<string> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Determinar el tipo MIME basado en la extensión
    let mimeType = 'image/jpeg';
    if (uri.toLowerCase().endsWith('.png')) {
      mimeType = 'image/png';
    } else if (uri.toLowerCase().endsWith('.gif')) {
      mimeType = 'image/gif';
    } else if (uri.toLowerCase().endsWith('.webp')) {
      mimeType = 'image/webp';
    }
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error convirtiendo imagen a base64:', error);
    throw new Error('No se pudo convertir la imagen a base64');
  }
};

/**
 * Analiza un documento usando el backend API
 */
export const analyzeDocument = async (
  imageUri: string,
  description: string
): Promise<AnalysisResult> => {
  try {
    // Verificar conexión a internet antes de continuar
    await checkNetworkConnection();

    // Convertir imagen a base64
    const imageBase64 = await imageUriToBase64(imageUri);

    // Llamar al backend con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos

    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64,
          description: description.trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `Error ${response.status}`;
        
        // Errores específicos del servidor
        if (response.status === 500) {
          throw new Error('ERROR_SERVER');
        }
        if (response.status === 503) {
          throw new Error('SERVICE_UNAVAILABLE');
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      return {
        extractedText: data.extractedText || '',
        summary: data.summary || '',
        label: data.label || 'Documento General',
        detectedInfo: data.detectedInfo,
        tags: data.tags,
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('TIMEOUT');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error en analyzeDocument:', error);
    
    // Detectar tipo de error de red
    const errorType = getNetworkErrorMessage(error);
    
    switch (errorType) {
      case 'NO_INTERNET':
        throw new Error('NO_INTERNET');
      case 'TIMEOUT':
        throw new Error('TIMEOUT');
      case 'API_UNREACHABLE':
        throw new Error('API_UNREACHABLE');
      case 'ERROR_SERVER':
        throw new Error('ERROR_SERVER');
      case 'SERVICE_UNAVAILABLE':
        throw new Error('SERVICE_UNAVAILABLE');
      default:
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('UNKNOWN_ERROR');
    }
  }
};

