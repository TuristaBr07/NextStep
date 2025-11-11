import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
// 1. Corrigido: O nome da classe é 'AppComponent', não 'App'
import { AppComponent } from './app/app';

// 2. Corrigido: Usar 'AppComponent' aqui também
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));