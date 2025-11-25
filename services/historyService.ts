import AsyncStorage from '@react-native-async-storage/async-storage';
import { HistoryItem } from '../types';
import { getHistoryFromBackend, deleteHistoryItemFromBackend } from './apiService';

const HISTORY_STORAGE_KEY = '@apunto_history';

// Verificar que AsyncStorage esté disponible
const isAsyncStorageAvailable = async (): Promise<boolean> => {
  try {
    await AsyncStorage.getItem('test');
    return true;
  } catch {
    return false;
  }
};

export const saveToHistory = async (item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<void> => {
  try {
    if (!(await isAsyncStorageAvailable())) {
      return;
    }
    const history = await getHistory();
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    const updatedHistory = [newItem, ...history];
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    // Silenciar errores para no bloquear la app
  }
};

/**
 * Obtiene el historial, intentando primero del backend, luego del almacenamiento local
 */
export const getHistory = async (userId?: string): Promise<HistoryItem[]> => {
  try {
    // Intentar obtener del backend primero
    try {
      const backendData = await getHistoryFromBackend(userId);
      
      // Convertir formato del backend al formato de la app
      const historyItems: HistoryItem[] = backendData.history.map((item: any) => ({
        id: item.id.toString(),
        imageUri: '', // El backend no guarda la imagen
        description: item.description,
        extractedText: item.extracted_text,
        summary: item.summary,
        label: item.label,
        timestamp: new Date(item.created_at).getTime(),
      }));

      // Sincronizar con almacenamiento local como respaldo
      if (historyItems.length > 0) {
        await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyItems));
      }

      return historyItems;
    } catch (backendError) {
      // Si falla el backend, usar almacenamiento local
      console.warn('No se pudo obtener historial del backend, usando almacenamiento local:', backendError);
      
      if (!(await isAsyncStorageAvailable())) {
        return [];
      }
      const data = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    }
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return [];
  }
};

export const clearHistory = async (): Promise<void> => {
  try {
    if (!(await isAsyncStorageAvailable())) {
      return;
    }
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    // Silenciar errores
  }
};

/**
 * Obtiene el historial solo del almacenamiento local (sin intentar backend)
 */
const getLocalHistory = async (): Promise<HistoryItem[]> => {
  try {
    if (!(await isAsyncStorageAvailable())) {
      return [];
    }
    const data = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    return [];
  }
};

/**
 * Elimina un elemento del historial, intentando primero en el backend, luego localmente
 */
export const deleteHistoryItem = async (id: string, userId?: string): Promise<void> => {
  try {
    // Intentar eliminar del backend primero
    try {
      await deleteHistoryItemFromBackend(id, userId);
      
      // También eliminar del almacenamiento local
      if (await isAsyncStorageAvailable()) {
        const history = await getLocalHistory();
        const filteredHistory = history.filter(item => item.id !== id);
        await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filteredHistory));
      }
    } catch (backendError) {
      // Si falla el backend, eliminar solo localmente
      console.warn('No se pudo eliminar del backend, eliminando solo localmente:', backendError);
      
      if (!(await isAsyncStorageAvailable())) {
        return;
      }
      const history = await getLocalHistory();
      const filteredHistory = history.filter(item => item.id !== id);
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filteredHistory));
    }
  } catch (error) {
    // Silenciar errores para no bloquear la app
    console.error('Error eliminando historial:', error);
  }
};

