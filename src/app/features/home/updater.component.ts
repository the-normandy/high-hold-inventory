import { Component, OnInit, signal } from '@angular/core';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process'
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-updater',
    templateUrl: 'updater.component.html',
    styles: `:host { @apply flex-1 w-fit; }`,
    imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule]
})
export class UpdaterComponent implements OnInit {

    ngOnInit() {
        this.verifyUpdate();
    }

    async verifyUpdate() {
        const update = await check();
        if (update) {
            this.updateData = update;
            this.version.set(update.version);
            this.shouldRenderUpdateRequest.set(true);
        }
    }

    renderMessage = signal<string | null>(null);
    shouldRenderUpdateRequest = signal<boolean>(false);
    shouldRenderUpdateProgress = signal<boolean>(false);
    shouldRenderUpdateError = signal<boolean>(false);
    version = signal<string | null>(null);
    updateData: Update | null = null;
    private updating = false;

    dismissUpdate() {
        this.shouldRenderUpdateRequest.set(false);
        this.shouldRenderUpdateProgress.set(false);
    }

    async startUpdate() {
        if (this.updating) {
            return;
        }

        this.updating = true;
        let phase;
        let downloaded = 0;
        let contentLength = 0;
        this.shouldRenderUpdateRequest.set(false);
        this.shouldRenderUpdateProgress.set(true);

        if (!this.updateData) { 
            this.shouldRenderUpdateProgress.set(false);
            this.shouldRenderUpdateError.set(true);
            this.renderMessage.set('An unknown error occurred.');
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

                        this.renderMessage.set(`Downloading: ${mbDownloaded} of ${mbTotal}`)
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
            this.shouldRenderUpdateProgress.set(false);
            this.shouldRenderUpdateError.set(true);
            console.error(error);
            this.renderMessage.set(`Update failed while ${phase}. If this persists, contact the-normandy with details.`);
         } finally {
            this.updating = false;
         }

        await relaunch();
    }
}