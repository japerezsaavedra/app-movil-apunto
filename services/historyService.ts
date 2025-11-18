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

export const getHistory = async (): Promise<HistoryItem[]> => {
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

export const deleteHistoryItem = async (id: string): Promise<void> => {
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

