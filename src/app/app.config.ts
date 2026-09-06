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
      inject(ThemeStore);
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
    })
  ]
};
