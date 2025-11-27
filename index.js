import { registerRootComponent } from 'expo';
import App from './App';

// Registrar directamente sin ErrorBoundary para evitar problemas en Android 14
registerRootComponent(App);

