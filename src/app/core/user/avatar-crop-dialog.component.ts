import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';

const PREVIEW_SIZE = 300;
const AVATAR_SIZE = 150;

@Component({
    selector: 'app-avatar-crop-dialog',
    templateUrl: 'avatar-crop-dialog.component.html',
    styleUrl: 'avatar-crop-dialog.component.css',
    imports: [MatButtonModule, MatDialogModule, MatIconModule, MatSliderModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarCropDialogComponent {
    private readonly file = inject<File>(MAT_DIALOG_DATA);
    private readonly dialogRef = inject(MatDialogRef<AvatarCropDialogComponent, Uint8Array>);
    private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
    private image: HTMLImageElement | null = null;
    private imageUrl: string | null = null;
    private baseScale = 1;
    private offsetX = 0;
    private offsetY = 0;
    private pointerX = 0;
    private pointerY = 0;

    protected readonly zoom = signal(1);
    protected readonly ready = signal(false);

    constructor() {
        inject(DestroyRef).onDestroy(() => {
            if (this.imageUrl) URL.revokeObjectURL(this.imageUrl);
        });
    }

    ngAfterViewInit(): void {
        this.loadImage();
    }

    protected updateZoom(value: number): void {
        this.zoom.set(Math.round(Math.min(3, Math.max(1, value)) * 100) / 100);
        this.constrainOffset();
        this.draw();
    }

    protected adjustZoom(amount: number): void {
        this.updateZoom(this.zoom() + amount);
    }

    protected zoomWithWheel(event: WheelEvent): void {
        if (event.deltaY === 0) return;

        event.preventDefault();
        this.adjustZoom(event.deltaY < 0 ? 0.1 : -0.1);
    }

    protected pointerDown(event: PointerEvent): void {
        this.pointerX = event.clientX;
        this.pointerY = event.clientY;
        this.canvas().nativeElement.setPointerCapture(event.pointerId);
    }

    protected pointerMove(event: PointerEvent): void {
        if (!this.canvas().nativeElement.hasPointerCapture(event.pointerId)) return;

        this.offsetX += event.clientX - this.pointerX;
        this.offsetY += event.clientY - this.pointerY;
        this.pointerX = event.clientX;
        this.pointerY = event.clientY;
        this.constrainOffset();
        this.draw();
    }

    protected nudge(event: KeyboardEvent): void {
        const movement = event.shiftKey ? 10 : 2;
        if (event.key === 'ArrowLeft') this.offsetX -= movement;
        else if (event.key === 'ArrowRight') this.offsetX += movement;
        else if (event.key === 'ArrowUp') this.offsetY -= movement;
        else if (event.key === 'ArrowDown') this.offsetY += movement;
        else return;

        event.preventDefault();
        this.constrainOffset();
        this.draw();
    }

    protected async save(): Promise<void> {
        const output = document.createElement('canvas');
        output.width = AVATAR_SIZE;
        output.height = AVATAR_SIZE;
        output.getContext('2d')?.drawImage(this.canvas().nativeElement, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
        const blob = await new Promise<Blob | null>(resolve => output.toBlob(resolve, 'image/png'));
        if (!blob) return;

        this.dialogRef.close(new Uint8Array(await blob.arrayBuffer()));
    }

    private loadImage(): void {
        this.imageUrl = URL.createObjectURL(this.file);
        const image = new Image();
        image.onload = () => {
            this.image = image;
            this.baseScale = Math.max(PREVIEW_SIZE / image.naturalWidth, PREVIEW_SIZE / image.naturalHeight);
            this.ready.set(true);
            this.draw();
        };
        image.src = this.imageUrl;
    }

    private constrainOffset(): void {
        if (!this.image) return;

        const width = this.image.naturalWidth * this.baseScale * this.zoom();
        const height = this.image.naturalHeight * this.baseScale * this.zoom();
        this.offsetX = Math.min((width - PREVIEW_SIZE) / 2, Math.max((PREVIEW_SIZE - width) / 2, this.offsetX));
        this.offsetY = Math.min((height - PREVIEW_SIZE) / 2, Math.max((PREVIEW_SIZE - height) / 2, this.offsetY));
    }

    private draw(): void {
        if (!this.image) return;

        const canvas = this.canvas().nativeElement;
        const context = canvas.getContext('2d');
        if (!context) return;

        const width = this.image.naturalWidth * this.baseScale * this.zoom();
        const height = this.image.naturalHeight * this.baseScale * this.zoom();
        context.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
        context.drawImage(
            this.image,
            (PREVIEW_SIZE - width) / 2 + this.offsetX,
            (PREVIEW_SIZE - height) / 2 + this.offsetY,
            width,
            height
        );
    }
}