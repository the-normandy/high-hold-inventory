import { computed, inject, Injectable } from "@angular/core";
import { ThemeStore } from "../core/theme/theme.store";

@Injectable({
    providedIn: 'root'
})
export class ColorStore {
    theme = inject(ThemeStore);
    resolve = computed(() => {
        this.theme.isDark();
        this.theme.accent();

        return {
            primary: this.resolveCssColor('--mat-sys-primary'),
            secondary: this.resolveCssColor('--mat-sys-secondary'),
            tertiary: this.resolveCssColor('--mat-sys-tertiary'),
            primaryContainer: this.resolveCssColor('--mat-sys-primary-container'),
            secondaryContainer: this.resolveCssColor('--mat-sys-secondary-container'),
            tertiaryContainer: this.resolveCssColor('--mat-sys-tertiary-container'),
            surface: this.resolveCssColor('--mat-sys-surface'),
            onSurface: this.resolveCssColor('--mat-sys-on-surface'),
            outline: this.resolveCssColor('--mat-sys-outline'),
            outlineVariant: this.resolveCssColor('--mat-sys-outline-variant')
        }
    })

    private resolveCssColor(cssVar: string): string {
        const el = document.createElement('div');
        el.style.color = `var(${cssVar})`;
        el.style.colorScheme = getComputedStyle(document.body).colorScheme;
        document.body.appendChild(el);
        const color = getComputedStyle(el).color;
        el.remove();
        return color;
    }
}