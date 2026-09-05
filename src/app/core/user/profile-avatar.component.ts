import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { BaseDirectory, readFile } from '@tauri-apps/plugin-fs';
import { UserProfile } from './user.model';
import { UserService } from './user.service';

@Component({
    selector: 'app-profile-avatar',
    template: `<img [src]="source()" [width]="size()" [height]="size()" [alt]="alt()" />`,
    styles: `
        :host,
        img {
            display: block;
            flex: 0 0 auto;
        }

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileAvatarComponent {
    readonly profile = input<UserProfile | null>();
    readonly size = input(150);
    readonly alt = input('');
    protected readonly source = signal('/avatar.png');

    private readonly user = inject(UserService);
    private objectUrl: string | null = null;
    private loadSequence = 0;

    constructor() {
        inject(DestroyRef).onDestroy(() => this.releaseObjectUrl());
        effect(() => {
            const profile = this.profile();
            this.user.avatarRevision();
            void this.load(profile);
        });
    }

    private async load(profile: UserProfile | null | undefined): Promise<void> {
        const sequence = ++this.loadSequence;
        this.releaseObjectUrl();
        this.source.set('/avatar.png');
        if (!profile || profile.photo === '/avatar.png') {
            return;
        }

        try {
            const bytes = await readFile(profile.photo, { baseDir: BaseDirectory.AppLocalData });
            const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
            if (sequence !== this.loadSequence) {
                URL.revokeObjectURL(objectUrl);
                return;
            }
            this.objectUrl = objectUrl;
            this.source.set(objectUrl);
        } catch {
            this.source.set('/avatar.png');
        }
    }

    private releaseObjectUrl(): void {
        if (this.objectUrl) {
            URL.revokeObjectURL(this.objectUrl);
            this.objectUrl = null;
        }
    }
}