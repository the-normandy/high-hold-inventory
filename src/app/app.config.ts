import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { ThemeStore } from './core/theme/theme.store';
import { MatIconRegistry } from '@angular/material/icon';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAppInitializer(() => { 
      const theme = inject(ThemeStore); 
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined')
    })
  ]
};
