import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet, RouterLinkWithHref } from '@angular/router';
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
import { firstValueFrom } from 'rxjs';
import { ProfileDialogComponent } from './features/home/profile-dialog.component';
import { UserService, UserProfileInput } from './core/user/user.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatToolbarModule, MatIconModule, MatButtonModule, RouterLinkWithHref, MatSlideToggleModule, MatTooltipModule, MatMenuModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
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
      await this.user.save(profile);
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

  async openProfile() {
    const dialogRef = this.dialog.open(ProfileDialogComponent, {
      width: '440px',
      data: this.user.profile()
    });
    const profile = await firstValueFrom(dialogRef.afterClosed()) as UserProfileInput | undefined;
    if (!profile) return;
    await this.user.save(profile);
    await Promise.all([
      this.dataService.load(),
      this.dataService.loadWebhook()
    ]);
  }

  async openDataFolder() {
    const rootPath = await appLocalDataDir();
    const profile = this.user.profile();
    await openPath(profile ? await join(rootPath, profile.path) : rootPath);
  }
  
  async getCurrentVersion() {
    const version = await getVersion();
    this.version.set(version);
  }

  async updateWindow() {
    await this.getCurrentVersion();
    await getCurrentWindow().setTitle(`Storehouse`);
  }

  themeChange() {
    this.mode.isDark.update(value => !value);
  }

  getSliderPosition() {
    return this.mode.isDark()
  }
}
