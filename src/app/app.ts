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
import { AvatarWorkflowService } from './core/user/avatar-workflow.service';
import { ProfileAvatarComponent } from './core/user/profile-avatar.component';
import { LegacyDataMigrationService } from './core/data/legacy-data-migration.service';
import { LegacyDataMigrationDialogComponent } from './features/home/legacy-data-migration-dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatToolbarModule, MatIconModule, MatButtonModule, RouterLink, MatTooltipModule, MatMenuModule, MatDividerModule, ProfileAvatarComponent],
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
  avatarWorkflow = inject(AvatarWorkflowService);
  migration = inject(LegacyDataMigrationService);
  router = inject(Router);
  ready = signal(false);

  constructor() {
    this.updateWindow();
  }

  async ngOnInit(): Promise<void> {
    await this.requireProfile();
    await this.offerLegacyDataMigration();
    await Promise.all([
      this.dataService.load(),
      this.dataService.loadWebhook()
    ]);
    this.ready.set(true);
  }

  private async offerLegacyDataMigration(): Promise<void> {
    const files = await this.migration.findLegacyFiles();
    if (files.length === 0) return;

    const dialogRef = this.dialog.open(LegacyDataMigrationDialogComponent, {
      width: '520px',
      disableClose: true,
      data: files
    });
    const shouldMigrate = await firstValueFrom(dialogRef.afterClosed()) as boolean;

    try {
      if (shouldMigrate) {
        await this.migration.migrate(files);
        this.snackBar.open('Previous app data migrated successfully.', 'OK', {duration: 3000});
      } else {
        await this.migration.completeDecision();
      }
    } catch {
      this.snackBar.open('Failed to migrate previous app data. You will be asked again next time.', 'OK', {duration: 4000});
    }
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
      await this.dataService.ensureInitialFile();
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
      await this.dataService.ensureInitialFile();
      await this.loadActiveProfile();
    } catch (error) {
      this.snackBar.open(error instanceof Error ? error.message : 'Failed to create profile.', 'OK', {duration: 3000});
    }
  }

  async switchProfile(path: string) {
    await this.user.switchProfile(path);
    await this.loadActiveProfile();
  }

  async changeAvatar() {
    const profile = this.user.profile();
    if (!profile) return;

    const avatar = await this.avatarWorkflow.selectAndCrop();
    if (!avatar) return;

    try {
      await this.user.updateAvatar(profile.path, avatar);
      this.snackBar.open('Profile picture updated.', 'OK', {duration: 2000});
    } catch {
      this.snackBar.open('Failed to update profile picture.', 'OK', {duration: 3000});
    }
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
