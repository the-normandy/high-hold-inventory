import { Component, inject, OnInit, signal } from '@angular/core';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process'
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-updater',
    templateUrl: 'updater.component.html',
    styles: `:host { @apply flex-1 w-fit; }`,
    imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule]
})
export class UpdaterComponent implements OnInit {
    private readonly snackBar = inject(MatSnackBar);

    ngOnInit(): void {
        void this.verifyUpdate();
    }

    async verifyUpdate(notifyWhenCurrent = false): Promise<void> {
        if (this.checking()) return;

        this.checking.set(true);
        try {
            const update = await check();
            if (update) {
                this.updateData = update;
                this.version.set(update.version);
                this.renderState.set('request');
            } else if (notifyWhenCurrent) {
                this.snackBar.open('Storehouse is up to date.', 'OK', { duration: 2500 });
            }
        } catch (error) {
            console.error(error);
            if (notifyWhenCurrent) {
                this.snackBar.open('Unable to check for updates.', 'OK', { duration: 3000 });
            }
        } finally {
            this.checking.set(false);
        }
    }

    debug: unknown = null;
    readonly checking = signal(false);
    renderMessage = signal<string | null>(null);
    renderState = signal<'idle' | 'request' | 'progress' | 'error'>('idle');
    version = signal<string | null>(null);
    updateData: Update | null = null;
    private updating = false;

    dismissUpdate() {
        this.renderState.set('idle');
    }

    async startUpdate() {
        if (this.updating) {
            return;
        }

        this.updating = true;
        let phase;
        let downloaded = 0;
        let contentLength = 0;
        this.renderMessage.set('Fetching update data...');
        this.renderState.set('progress');

        if (!this.updateData) { 
            this.renderState.set('error');
            this.renderMessage.set('An unknown error occurred when fetching update data.');
            return;
         }

         try {
            await this.updateData.downloadAndInstall((event) => {
                switch(event.event) {
                    case 'Started': {
                        phase = 'downloading';
                        contentLength = event.data.contentLength ?? 0;
                        this.renderMessage.set('Starting update...');
                        break;
                    }
                    case 'Progress': {
                        downloaded += event.data.chunkLength;

                        const mbDownloaded = (downloaded / 1024 / 1024).toFixed(1);
                        const mbTotal = (contentLength / 1024 / 1024).toFixed(1);

                        this.renderMessage.set(`Downloading: ${mbDownloaded} / ${mbTotal} MB`)
                        break;
                    }
                    case 'Finished': {
                        phase = 'installing';
                        this.renderMessage.set("Download finished. Installing...");
                        break;
                    }
                }
            });
         } catch(error) {
            console.error(error);
            this.renderState.set('error')
            this.renderMessage.set(`Update failed while ${phase}. If this persists, contact the-normandy with details.`);
         } finally {
            this.updating = false;
         }

        await relaunch();
    }
}