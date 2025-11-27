import * as FileSystem from 'expo-file-system';
import NetInfo from '@react-native-community/netinfo';
import { AnalysisResult } from '../types';

// URL del backend - debe configurarse mediante variable de entorno EXPO_PUBLIC_API_URL
// Ver .env.example para más información
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error(
    'EXPO_PUBLIC_API_URL no está configurada. Por favor, crea un archivo .env con EXPO_PUBLIC_API_URL configurada. ' +
    'Ver .env.example para más información.'
  );
}

/**
 * Verifica si hay conexión a internet
 */
const checkNetworkConnection = async (): Promise<void> => {
  const netInfo = await NetInfo.fetch();
  const networkState = {
    isConnected: netInfo.isConnected,
    type: netInfo.type,
    isInternetReachable: netInfo.isInternetReachable,
    details: netInfo.details,
  };
  console.log('Estado de red:', networkState);
  
  if (!netInfo.isConnected) {
    console.error('No hay conexión a internet');
    throw new Error('NO_INTERNET');
  }
  if (netInfo.isConnected && netInfo.type === 'none') {
    console.error('Tipo de conexión: none');
    throw new Error('NO_INTERNET');
  }
  
  // Verificar si realmente puede alcanzar internet
  if (netInfo.isConnected && netInfo.isInternetReachable === false) {
    console.warn('Conectado pero internet no alcanzable');
    // No lanzar error aquí, intentar de todas formas
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

    // Log para debugging
    const requestUrl = `${API_BASE_URL}/analyze`;
    console.log('=== Iniciando análisis ===');
    console.log('URL del backend:', requestUrl);
    console.log('Descripción:', description.trim());
    console.log('Tamaño de imagen base64:', imageBase64.length, 'caracteres');
    console.log('Plataforma:', require('react-native').Platform.OS);

    // Llamar al backend con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('Timeout alcanzado después de 90 segundos');
      controller.abort();
    }, 90000); // 90 segundos (aumentado para análisis complejos)

    try {
      const response = await fetch(requestUrl, {
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
        
        console.error('Error del servidor:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
        });
        
        // Errores específicos del servidor
        if (response.status === 500) {
          // Incluir más detalles del error para debugging
          const detailedError = errorData.message || errorData.error || 'Error interno del servidor';
          console.error('Error 500 detallado:', detailedError);
          throw new Error(`ERROR_SERVER: ${detailedError}`);
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
      
      console.error('=== Error en fetch ===');
      console.error('Error completo:', fetchError);
      if (fetchError instanceof Error) {
        console.error('Mensaje de error:', fetchError.message);
        console.error('Nombre del error:', fetchError.name);
        console.error('Stack:', fetchError.stack);
      }
      
      // Verificar si es un error de red específico
      if (fetchError instanceof TypeError) {
        if (fetchError.message.includes('Network request failed') || 
            fetchError.message.includes('Failed to fetch')) {
          console.error('Error de red: No se pudo conectar al servidor');
          throw new Error('API_UNREACHABLE');
        }
      }
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('TIMEOUT');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error en analyzeDocument:', error);
    if (error instanceof Error) {
      console.error('Tipo de error:', error.constructor.name);
      console.error('Mensaje completo:', error.message);
      console.error('Stack:', error.stack);
    }
    
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


