import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { AppState, HistoryItem, AnalysisResult } from './types';
import { analyzeDocument } from './services/apiService';
import * as HistoryService from './services/historyService';

export default function App() {
  // Logging mínimo para evitar problemas en dispositivos físicos
  if (__DEV__) {
    console.log('App iniciando');
  }
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [appState, setAppState] = useState<AppState>(AppState.CAMERA);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mostrar splash screen al iniciar
  useEffect(() => {
    // Timeout simple: ocultar splash después de 1.5 segundos
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, []);


  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        // Si no hay permisos, ofrecer usar galería
        Alert.alert(
          'Permisos necesarios',
          'Se necesita acceso a la cámara. ¿Deseas seleccionar una imagen de la galería?',
          [
            { text: 'Galería', onPress: handleSelectFromGallery },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setDescription('');
        setAppState(AppState.DESCRIPTION);
        setAnalysisResult(null);
        setErrorMessage('');
      }
    } catch (error) {
      // Si falla la cámara, ofrecer usar galería
      Alert.alert(
        'Cámara no disponible',
        'No se pudo abrir la cámara. ¿Deseas seleccionar una imagen de la galería?',
        [
          { text: 'Galería', onPress: handleSelectFromGallery },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos necesarios',
          'Se necesita acceso a la galería.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setDescription('');
        setAppState(AppState.DESCRIPTION);
        setAnalysisResult(null);
        setErrorMessage('');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo acceder a la galería.');
    }
  };


  const getErrorMessage = (error: Error): string => {
    const errorMessage = error.message;
    console.log('Procesando error:', errorMessage);

    // Manejar errores que empiezan con prefijos específicos
    if (errorMessage.startsWith('ERROR_SERVER:')) {
      const serverError = errorMessage.replace('ERROR_SERVER:', '').trim();
      return `Error en el servidor: ${serverError}`;
    }

    switch (errorMessage) {
      case 'NO_INTERNET':
        return 'No hay conexión a internet. Por favor, verifica tu conexión de red e intenta nuevamente.';
      case 'TIMEOUT':
        return 'La solicitud tardó demasiado tiempo. Por favor, verifica tu conexión e intenta nuevamente.';
      case 'API_UNREACHABLE':
        return 'No se pudo conectar con el servidor. Verifica tu conexión a internet y que el backend esté disponible.';
      case 'ERROR_SERVER':
        return 'Error en el servidor. Por favor, intenta nuevamente más tarde.';
      case 'SERVICE_UNAVAILABLE':
        return 'El servicio no está disponible en este momento. Por favor, intenta más tarde.';
      case 'UNKNOWN_ERROR':
        return 'Ocurrió un error desconocido. Por favor, intenta nuevamente.';
      default:
        // Si el mensaje contiene información útil, mostrarla
        if (errorMessage.includes('Network request failed') || 
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('NetworkError')) {
          return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
        }
        return `Error: ${errorMessage}`;
    }
  };

  const handleSend = async () => {
    if (!selectedImage || !description.trim()) {
      Alert.alert('Error', 'Por favor ingresa una descripción del documento.');
      return;
    }

    setIsProcessing(true);
    setAppState(AppState.PROCESSING);
    setErrorMessage('');

    // Timeout de seguridad: si después de 2 minutos no hay respuesta, mostrar error
    let safetyTimeoutCleared = false;
    const safetyTimeout = setTimeout(() => {
      if (!safetyTimeoutCleared) {
        console.error('Timeout de seguridad alcanzado');
        setIsProcessing(false);
        setErrorMessage('El análisis está tardando demasiado. Por favor, intenta nuevamente.');
        setAppState(AppState.ERROR);
      }
    }, 120000); // 2 minutos

    try {
      console.log('Iniciando análisis...');
      const result = await analyzeDocument(selectedImage, description);
      console.log('Análisis completado:', result);
      
      safetyTimeoutCleared = true;
      clearTimeout(safetyTimeout);
      
      setAnalysisResult(result);

      // Guardar en historial (sin bloquear si falla)
      if (selectedImage) {
        try {
          await HistoryService.saveToHistory({
            imageUri: selectedImage,
            description: description,
            extractedText: result.extractedText,
            summary: result.summary,
            label: result.label,
          });
        } catch (historyError) {
          // Ignorar errores de historial para no bloquear la app
        }
      }

      setIsProcessing(false);
      setAppState(AppState.RESULTS);
    } catch (error) {
      safetyTimeoutCleared = true;
      clearTimeout(safetyTimeout);
      console.error('=== Error en handleSend ===');
      console.error('Error completo:', error);
      if (error instanceof Error) {
        console.error('Mensaje:', error.message);
        console.error('Stack:', error.stack);
      }
      setIsProcessing(false);
      const errorMsg = error instanceof Error ? getErrorMessage(error) : 'Error desconocido al procesar el documento';
      console.error('Mensaje de error para el usuario:', errorMsg);
      setErrorMessage(errorMsg);
      setAppState(AppState.ERROR);
    }
  };

  const handleCancelProcessing = () => {
    console.log('Cancelando procesamiento...');
    setIsProcessing(false);
    setAppState(AppState.DESCRIPTION);
    // No mostrar alerta para cancelación manual del usuario
  };

  const handleReset = () => {
    setSelectedImage(null);
    setDescription('');
    setAnalysisResult(null);
    setErrorMessage('');
    setSelectedHistoryItem(null);
    setAppState(AppState.CAMERA);
  };

  const loadHistory = async () => {
    try {
      console.log('Cargando historial...');
      // TODO: Obtener userId si tienes autenticación
      const userId = undefined; // Puedes obtener esto de tu sistema de autenticación
      
      // Timeout de seguridad para cargar historial
      const timeoutPromise = new Promise<HistoryItem[]>((resolve) => {
        setTimeout(() => {
          console.warn('Timeout cargando historial, usando array vacío');
          resolve([]);
        }, 3000); // 3 segundos máximo
      });
      
      const historyPromise = HistoryService.getHistory(userId);
      const historyData = await Promise.race([historyPromise, timeoutPromise]);
      
      setHistory(historyData || []);
      console.log('Historial cargado:', (historyData || []).length, 'elementos');
    } catch (error) {
      console.error('Error cargando historial:', error);
      setHistory([]);
    }
  };

  useEffect(() => {
    if (appState === AppState.HISTORY) {
      loadHistory().catch((error) => {
        console.error('Error en useEffect loadHistory:', error);
        setHistory([]);
      });
    }
  }, [appState]);

  const handleViewHistory = () => {
    setAppState(AppState.HISTORY);
  };

  const handleViewHistoryItem = (item: HistoryItem) => {
    setSelectedHistoryItem(item);
    setAnalysisResult({
      extractedText: item.extractedText,
      summary: item.summary,
      label: item.label,
    });
    setAppState(AppState.RESULTS);
  };

  const handleDeleteHistoryItem = async (id: string) => {
    Alert.alert(
      'Eliminar',
      '¿Estás seguro de que deseas eliminar este elemento del historial?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Obtener userId si tienes autenticación
              const userId = undefined; // Puedes obtener esto de tu sistema de autenticación
              await HistoryService.deleteHistoryItem(id, userId);
              await loadHistory();
            } catch {
              // Ignorar errores
            }
          },
        },
      ]
    );
  };

  const renderSplashScreen = () => {
    try {
      return (
        <View style={styles.splashContainer}>
          <View style={styles.splashLogoContainer}>
            <Image
              source={require('./main_logo.png')}
              style={styles.splashLogo}
              resizeMode="contain"
              onError={(error) => {
                console.log('Error cargando logo:', error);
              }}
            />
          </View>
          <Text style={styles.splashText}>Apunto</Text>
          <Text style={styles.splashSubtext}>Análisis inteligente de apuntes escritos a mano</Text>
        </View>
      );
    } catch (error) {
      // Si hay error con la imagen, mostrar solo texto
      return (
        <View style={styles.splashContainer}>
          <Text style={styles.splashText}>Apunto</Text>
          <Text style={styles.splashSubtext}>Análisis inteligente de apuntes escritos a mano</Text>
        </View>
      );
    }
  };

  const renderNavBar = (title: string, showBack: boolean = false, onBack?: () => void) => (
    <View style={styles.navBar}>
      {showBack && onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.navBackButton}>
          <MaterialIcons name="arrow-back" size={24} color="#7c3aed" />
        </TouchableOpacity>
      ) : (
        <View style={styles.navBackButton} />
      )}
      <Text style={styles.navTitle}>{title}</Text>
      <View style={styles.navBackButton} />
    </View>
  );

  const renderBottomNav = () => {
    // Solo mostrar en pantallas principales
    if (appState === AppState.PROCESSING || appState === AppState.ERROR) {
      return null;
    }

    return (
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.bottomNavButton, appState === AppState.CAMERA && styles.bottomNavButtonActive]}
          onPress={() => {
            if (appState !== AppState.CAMERA) {
              handleReset();
            }
          }}
          disabled={appState === AppState.CAMERA}
        >
          <MaterialIcons
            name="camera-alt"
            size={24}
            color={appState === AppState.CAMERA ? "#7c3aed" : "#64748b"}
            style={styles.bottomNavIcon}
          />
          <Text style={[styles.bottomNavLabel, appState === AppState.CAMERA && styles.bottomNavLabelActive]}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomNavButton, appState === AppState.HISTORY && styles.bottomNavButtonActive]}
          onPress={handleViewHistory}
          disabled={appState === AppState.HISTORY}
        >
          <MaterialIcons
            name="history"
            size={24}
            color={appState === AppState.HISTORY ? "#7c3aed" : "#64748b"}
            style={styles.bottomNavIcon}
          />
          <Text style={[styles.bottomNavLabel, appState === AppState.HISTORY && styles.bottomNavLabelActive]}>Historial</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCameraScreen = () => (
    <View style={styles.screenContainer}>
      {renderNavBar('Apunto', false)}

      <View style={styles.mainContentArea}>
        <View style={styles.cameraArea}>
          <Image
            source={require('./main_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.cameraTitle}>Analiza tus apuntes</Text>
          <Text style={styles.cameraSubtitle}>
            Captura cualquier apunte escrito a mano, en pizarra o papel para analizarlo con IA
          </Text>
        </View>
      </View>

      <View style={styles.bottomActionBar}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, styles.bottomButton]}
          onPress={handleTakePhoto}
        >
          <MaterialIcons name="camera-alt" size={20} color="#ffffff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Tomar Foto</Text>
        </TouchableOpacity>
      </View>

      {renderBottomNav()}
    </View>
  );

  const renderDescriptionScreen = () => (
    <View style={styles.screenContainer}>
      {renderNavBar('Descripción del documento', true, handleReset)}

      <View style={styles.mainContent}>
        {selectedImage && (
          <Image
            source={{ uri: selectedImage }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Descripción del documento</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Describe el contenido: qué es, dónde está escrito (pizarra, papel, etc.), tema o contexto, ecuaciones, diagramas, etc."
            placeholderTextColor="#94a3b8"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

      </View>

      <View style={styles.bottomActionBar}>
        <TouchableOpacity
          onPress={handleSend}
          disabled={!description.trim()}
          style={[
            styles.button,
            styles.primaryButton,
            styles.bottomButton,
            !description.trim() && styles.buttonDisabled
          ]}
        >
          <Text style={styles.buttonText}>Analizar Documento</Text>
        </TouchableOpacity>
      </View>

      {renderBottomNav()}
    </View>
  );

  const renderResultsScreen = () => (
    <View style={styles.screenContainer}>
      {renderNavBar('Resultados del análisis', true, handleReset)}

      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        {analysisResult && (
          <>
            <View style={styles.labelContainer}>
              <Text style={styles.labelText}>Etiqueta Principal:</Text>
              <View style={styles.labelBadge}>
                <Text style={styles.labelBadgeText}>{analysisResult.label}</Text>
              </View>
            </View>

            {analysisResult.tags && analysisResult.tags.length > 0 && (
              <View style={styles.resultSection}>
                <Text style={styles.sectionTitle}>Etiquetas</Text>
                <View style={styles.tagsContainer}>
                  {analysisResult.tags.map((tag, index) => (
                    <View key={index} style={styles.tagBadge}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {analysisResult.detectedInfo && (
              <>
                <View style={styles.resultSection}>
                  <Text style={styles.sectionTitle}>Tipo de Documento</Text>
                  <View style={styles.resultBox}>
                    <Text style={styles.resultText}>{analysisResult.detectedInfo.documentType}</Text>
                  </View>
                </View>

                {analysisResult.detectedInfo.entities && analysisResult.detectedInfo.entities.length > 0 && (
                  <View style={styles.resultSection}>
                    <Text style={styles.sectionTitle}>Información Detectada</Text>
                    <View style={styles.resultBox}>
                      {analysisResult.detectedInfo.entities.map((entity, index) => (
                        <View key={index} style={styles.entityItem}>
                          <Text style={styles.entityType}>{entity.type}:</Text>
                          <Text style={styles.entityValue}>{entity.value}</Text>
                          <Text style={styles.entityConfidence}>({entity.confidence})</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {analysisResult.detectedInfo.keyPoints && analysisResult.detectedInfo.keyPoints.length > 0 && (
                  <View style={styles.resultSection}>
                    <Text style={styles.sectionTitle}>Puntos Clave</Text>
                    <View style={styles.resultBox}>
                      {analysisResult.detectedInfo.keyPoints.map((point, index) => (
                        <Text key={index} style={styles.keyPointText}>
                          • {point}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}

                {analysisResult.detectedInfo.understanding && (
                  <View style={styles.resultSection}>
                    <Text style={styles.sectionTitle}>Comprensión del Documento</Text>
                    <View style={styles.resultBox}>
                      <Text style={styles.resultText}>{analysisResult.detectedInfo.understanding}</Text>
                    </View>
                  </View>
                )}
              </>
            )}

            <View style={styles.resultSection}>
              <Text style={styles.sectionTitle}>Texto Extraído (OCR)</Text>
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>{analysisResult.extractedText}</Text>
              </View>
            </View>

            <View style={styles.resultSection}>
              <Text style={styles.sectionTitle}>Resumen Completo</Text>
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>{analysisResult.summary}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.bottomActionBar}>
        <TouchableOpacity
          onPress={handleReset}
          style={[styles.button, styles.primaryButton, styles.bottomButton]}
        >
          <Text style={styles.buttonText}>Nueva Captura</Text>
        </TouchableOpacity>
      </View>

      {renderBottomNav()}
    </View>
  );

  const renderProcessingScreen = () => (
    <View style={styles.screenContainer}>
      {renderNavBar('Procesando', true, handleCancelProcessing)}
      <View style={styles.processingContainer}>
        <Image
          source={require('./main_logo.png')}
          style={styles.processingLogo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.processingText}>
          Procesando documento...
        </Text>
        <Text style={styles.processingSubtext}>
          Analizando con OCR y IA
        </Text>
        <Text style={styles.processingSubtext}>
          Esto puede tardar unos momentos
        </Text>
      </View>
      <View style={styles.bottomActionBar}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, styles.bottomButton]}
          onPress={handleCancelProcessing}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHistoryScreen = () => (
    <View style={styles.screenContainer}>
      {renderNavBar('Historial', true, handleReset)}

      <ScrollView
        style={styles.historyScroll}
        contentContainerStyle={styles.historyContent}
        showsVerticalScrollIndicator={false}
      >
        {history.length === 0 ? (
          <View style={styles.emptyHistoryContainer}>
            <Text style={styles.emptyHistoryText}>No hay elementos en el historial</Text>
            <Text style={styles.emptyHistorySubtext}>Los análisis realizados aparecerán aquí</Text>
          </View>
        ) : (
          history.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.historyItem}
              onPress={() => handleViewHistoryItem(item)}
            >
              <View style={styles.historyItemHeader}>
                <View style={styles.historyItemLabel}>
                  <Text style={styles.historyItemLabelText}>{item.label}</Text>
                </View>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteHistoryItem(item.id);
                  }}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.historyItemDescription} numberOfLines={1}>
                {item.description}
              </Text>

              <Text style={styles.historyItemSummary} numberOfLines={2}>
                {item.summary}
              </Text>

              <Text style={styles.historyItemDate}>
                {new Date(item.timestamp).toLocaleString('es-ES')}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {renderBottomNav()}
    </View>
  );

  const renderErrorScreen = () => {
    const isNetworkError = errorMessage.includes('conexión') ||
      errorMessage.includes('internet') ||
      errorMessage.includes('servidor') ||
      errorMessage.includes('conectar');

    return (
      <View style={styles.screenContainer}>
        {renderNavBar('Error', true, handleReset)}
        <View style={styles.errorContainer}>
          <MaterialIcons
            name={isNetworkError ? "wifi-off" : "error-outline"}
            size={64}
            color="#dc2626"
            style={styles.errorIcon}
          />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          {isNetworkError && (
            <View style={styles.errorHint}>
              <Text style={styles.errorHintText}>
                • Verifica que tu dispositivo esté conectado a internet{'\n'}
                • Revisa la configuración de red{'\n'}
                • Intenta nuevamente cuando tengas conexión
              </Text>
            </View>
          )}
        </View>
        <View style={styles.bottomActionBar}>
          <TouchableOpacity
            onPress={handleReset}
            style={[styles.button, styles.secondaryButton, styles.bottomButton]}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Volver</Text>
          </TouchableOpacity>
          {isNetworkError && (
            <TouchableOpacity
              onPress={handleSend}
              style={[styles.button, styles.primaryButton, styles.bottomButton]}
            >
              <MaterialIcons name="refresh" size={20} color="#ffffff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Reintentar</Text>
            </TouchableOpacity>
          )}
        </View>
        {renderBottomNav()}
      </View>
    );
  };

  const renderCurrentScreen = () => {
    if (showSplash) {
      return renderSplashScreen();
    }

    switch (appState) {
      case AppState.CAMERA:
        return renderCameraScreen();
      case AppState.DESCRIPTION:
        return renderDescriptionScreen();
      case AppState.RESULTS:
        return renderResultsScreen();
      case AppState.PROCESSING:
        return renderProcessingScreen();
      case AppState.HISTORY:
        return renderHistoryScreen();
      case AppState.ERROR:
        return renderErrorScreen();
      default:
        return renderCameraScreen();
    }
  };

  const currentScreen = renderCurrentScreen();
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      {currentScreen}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  screenContainer: {
    flex: 1,
    paddingBottom: 0,
  },
  mainContentArea: {
    flex: 1,
    padding: 16,
    paddingBottom: 0,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7c3aed',
    flex: 1,
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 8,
    paddingBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomNavButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  bottomNavButtonActive: {
    backgroundColor: '#faf5ff',
  },
  bottomNavIcon: {
    marginBottom: 4,
  },
  bottomNavLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  bottomNavLabelActive: {
    color: '#7c3aed',
    fontWeight: '600',
  },
  bottomActionBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomButton: {
    flex: 1,
    minHeight: 52,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  splashLogoContainer: {
    width: 200,
    height: 200,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 200,
    height: 200,
    backgroundColor: 'transparent',
  },
  splashText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 8,
    letterSpacing: 1,
  },
  splashSubtext: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  headerWithBack: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  backButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  cameraArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  cameraButtonsContainer: {
    width: '100%',
    marginTop: 24,
  },
  cameraButton: {
    flex: 0,
    width: '100%',
    minHeight: 48,
  },
  cameraTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#7c3aed',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  cameraSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  mainContent: {
    flex: 1,
    padding: 16,
    paddingBottom: 0,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c3aed',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    minHeight: 100,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    flex: 1,
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: '#f97316',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#334155',
  },
  fullWidthButton: {
    flex: 1,
  },
  historyButton: {
    marginTop: 16,
    width: '100%',
  },
  historyScroll: {
    flex: 1,
  },
  historyContent: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyHistoryContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyHistoryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7c3aed',
    marginBottom: 8,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  historyItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyItemLabel: {
    backgroundColor: '#f97316',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  historyItemLabelText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
  },
  historyItemDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
    marginBottom: 8,
  },
  historyItemSummary: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 18,
  },
  historyItemDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#f8fafc',
  },
  processingText: {
    color: '#7c3aed',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  processingSubtext: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
  processingLogo: {
    width: 100,
    height: 100,
    marginBottom: 24,
    opacity: 0.8,
    backgroundColor: 'transparent',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    marginBottom: 16,
    opacity: 0.8,
  },
  errorTitle: {
    fontWeight: 'bold',
    color: '#dc2626',
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    color: '#991b1b',
    fontSize: 15,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorHint: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorHintText: {
    color: '#991b1b',
    fontSize: 13,
    lineHeight: 20,
  },
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    padding: 16,
    paddingBottom: 8,
  },
  labelContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  labelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c3aed',
    marginBottom: 12,
  },
  labelBadge: {
    backgroundColor: '#f97316',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  labelBadgeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7c3aed',
    marginBottom: 12,
  },
  resultBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resultText: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    backgroundColor: '#faf5ff',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  tagText: {
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: '600',
  },
  entityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  entityType: {
    color: '#7c3aed',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
    textTransform: 'capitalize',
  },
  entityValue: {
    color: '#334155',
    fontSize: 13,
    flex: 1,
  },
  entityConfidence: {
    color: '#94a3b8',
    fontSize: 11,
    marginLeft: 6,
    fontStyle: 'italic',
  },
  keyPointText: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6,
  },
});
