import AsyncStorage from '@react-native-async-storage/async-storage';
import { HistoryItem } from '../types';

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
 * Obtiene el historial del almacenamiento local
 */
export const getHistory = async (userId?: string): Promise<HistoryItem[]> => {
  try {
    if (!(await isAsyncStorageAvailable())) {
      return [];
    }
    const data = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        // Validar que sea un array
        if (Array.isArray(parsed)) {
          return parsed;
        } else {
          // Si no es un array, limpiar y retornar vacío
          await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
          return [];
        }
      } catch (parseError) {
        // Si hay error al parsear, limpiar el historial corrupto
        await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
        return [];
      }
    }
    return [];
  } catch (error) {
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
 * Elimina un elemento del historial del almacenamiento local
 */
export const deleteHistoryItem = async (id: string, userId?: string): Promise<void> => {
  try {
    if (!(await isAsyncStorageAvailable())) {
      return;
    }
    const history = await getHistory();
    const filteredHistory = history.filter(item => item.id !== id);
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filteredHistory));
  } catch (error) {
    // Silenciar errores
  }
};

/**
 * Actualiza un elemento del historial con ediciones y feedback
 */
export const updateHistoryItem = async (
  id: string,
  updates: {
    editedExtractedText?: string;
    editedSummary?: string;
    liked?: boolean | null;
  }
): Promise<void> => {
  try {
    if (!(await isAsyncStorageAvailable())) {
      return;
    }
    const history = await getHistory();
    const updatedHistory = history.map(item => {
      if (item.id === id) {
        const isEdited = !!(
          (updates.editedExtractedText && updates.editedExtractedText !== item.extractedText) ||
          (updates.editedSummary && updates.editedSummary !== item.summary)
        );
        return {
          ...item,
          ...updates,
          isEdited: isEdited || item.isEdited,
        };
      }
      return item;
    });
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    // Silenciar errores
  }
};

