import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ThemeStore } from './core/theme/theme.store';
import { getVersion } from '@tauri-apps/api/app'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { DataService } from './core/data/data.service';
import { openPath } from '@tauri-apps/plugin-opener';
import { appLocalDataDir, join } from '@tauri-apps/api/path';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { firstValueFrom } from 'rxjs';
import { ProfileDialogComponent } from './features/home/profile-dialog.component';
import { UserService, UserProfileInput } from './core/user/user.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatToolbarModule, MatIconModule, MatButtonModule, RouterLink, MatTooltipModule, MatMenuModule, MatDividerModule, NgOptimizedImage],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  version = signal<string>('');
  protected readonly title = computed(() => `Storehouse`);
  mode = inject(ThemeStore);
  dataService = inject(DataService);
  dataError = this.dataService.error;
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);
  user = inject(UserService);
  router = inject(Router);
  ready = signal(false);

  constructor() {
    this.updateWindow();
  }

  async ngOnInit(): Promise<void> {
    await this.requireProfile();
    await Promise.all([
      this.dataService.load(),
      this.dataService.loadWebhook()
    ]);
    this.ready.set(true);
  }

  private async requireProfile(): Promise<void> {
    try {
      await this.user.load();
    } catch {
      const dialogRef = this.dialog.open(ProfileDialogComponent, {
        width: '440px',
        disableClose: true
      });
      const profile = await firstValueFrom(dialogRef.afterClosed()) as UserProfileInput;
      await this.user.create(profile);
    }
  }

  async retryLoadData() {
    this.dataService.load();
  }

  async refreshData() {
    try {
      await this.retryLoadData();
      this.snackBar.open('Data synchronized successfully.', 'OK', {duration: 2000});
    } catch {
      this.snackBar.open('Failed to synchronize data.', 'OK', {duration: 2000});
    }
  }

  async createProfile() {
    const dialogRef = this.dialog.open(ProfileDialogComponent, {
      width: '440px',
      data: { canCancel: true }
    });
    const profile = await firstValueFrom(dialogRef.afterClosed()) as UserProfileInput | undefined;
    if (!profile) return;
    try {
      await this.user.create(profile);
      await this.loadActiveProfile();
    } catch (error) {
      this.snackBar.open(error instanceof Error ? error.message : 'Failed to create profile.', 'OK', {duration: 3000});
    }
  }

  async switchProfile(path: string) {
    await this.user.switchProfile(path);
    await this.loadActiveProfile();
  }

  private async loadActiveProfile() {
    await Promise.all([this.dataService.load(), this.dataService.loadWebhook()]);
    await this.router.navigateByUrl('/');
  }

  async openDataFolder() {
    const rootPath = await appLocalDataDir();
    const profile = this.user.profile();
    await openPath(profile ? await join(rootPath, profile.clanPath) : rootPath);
  }

  async openAppFolder() {
    await openPath(await appLocalDataDir());
  }
  
  async getCurrentVersion() {
    const version = await getVersion();
    this.version.set(version);
  }

  async updateWindow() {
    await this.getCurrentVersion();
    await getCurrentWindow().setTitle(`Storehouse`);
  }

  setDarkMode(isDark: boolean) {
    this.mode.isDark.set(isDark);
  }
}
