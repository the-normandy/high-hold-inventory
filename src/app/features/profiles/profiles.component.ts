import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DataService } from '../../core/data/data.service';
import { UserProfile } from '../../core/user/user.model';
import { UserProfileInput, UserService } from '../../core/user/user.service';
import { ProfileDialogComponent } from '../home/profile-dialog.component';
import { ProfileDeleteDialogComponent } from './profile-delete-dialog.component';
import { AvatarWorkflowService } from '../../core/user/avatar-workflow.service';
import { ProfileAvatarComponent } from '../../core/user/profile-avatar.component';

@Component({
    selector: 'app-profiles',
    templateUrl: 'profiles.component.html',
    styleUrl: 'profiles.component.css',
    imports: [MatButtonModule, MatDialogModule, MatIconModule, MatTooltipModule, RouterLink, ProfileAvatarComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilesComponent {
    protected readonly user = inject(UserService);
    private readonly dataService = inject(DataService);
    private readonly dialog = inject(MatDialog);
    private readonly snackBar = inject(MatSnackBar);
    private readonly avatarWorkflow = inject(AvatarWorkflowService);

    async createProfile(mandatory = false): Promise<void> {
        const dialogRef = this.dialog.open(ProfileDialogComponent, {
            width: '440px',
            disableClose: mandatory,
            data: { canCancel: !mandatory }
        });
        const input = await firstValueFrom(dialogRef.afterClosed()) as UserProfileInput | undefined;
        if (!input) return;

        try {
            await this.user.create(input);
            await this.dataService.ensureInitialFile();
            await this.reloadClanData();
            this.snackBar.open(`${input.name.trim()} is now active.`, 'OK', { duration: 2000 });
        } catch (error) {
            this.snackBar.open(error instanceof Error ? error.message : 'Failed to create profile.', 'OK', { duration: 3000 });
            if (mandatory) await this.createProfile(true);
        }
    }

    async switchProfile(profile: UserProfile): Promise<void> {
        if (profile.path === this.user.profile()?.path) return;

        try {
            await this.user.switchProfile(profile.path);
            await this.reloadClanData();
            this.snackBar.open(`Switched to ${profile.name}.`, 'OK', { duration: 2000 });
        } catch {
            this.snackBar.open('Failed to switch profiles.', 'OK', { duration: 3000 });
        }
    }

    async changeAvatar(profile: UserProfile): Promise<void> {
        const avatar = await this.avatarWorkflow.selectAndCrop();
        if (!avatar) return;

        try {
            await this.user.updateAvatar(profile.path, avatar);
            this.snackBar.open('Profile picture updated.', 'OK', { duration: 2000 });
        } catch {
            this.snackBar.open('Failed to update profile picture.', 'OK', { duration: 3000 });
        }
    }

    async deleteProfile(profile: UserProfile): Promise<void> {
        const dialogRef = this.dialog.open(ProfileDeleteDialogComponent, {
            width: '520px',
            data: profile
        });
        const confirmed = await firstValueFrom(dialogRef.afterClosed()) as boolean;
        if (!confirmed) return;

        const deletingActiveProfile = profile.path === this.user.profile()?.path;
        try {
            await this.user.deleteProfile(profile.path);
            if (!this.user.profile()) {
                await this.createProfile(true);
            } else if (deletingActiveProfile) {
                await this.reloadClanData();
            }
            this.snackBar.open(`${profile.name} was deleted.`, 'OK', { duration: 2000 });
        } catch {
            this.snackBar.open('Failed to delete profile.', 'OK', { duration: 3000 });
        }
    }

    private async reloadClanData(): Promise<void> {
        await Promise.all([this.dataService.load(), this.dataService.loadWebhook()]);
    }
}