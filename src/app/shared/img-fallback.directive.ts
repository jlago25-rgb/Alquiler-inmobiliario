import { Directive, ElementRef, HostListener, Input, inject } from '@angular/core';
import { FALLBACK_IMAGE } from '../data/seed-data';

@Directive({
  selector: 'img[appImgFallback]',
  standalone: true,
})
export class ImgFallbackDirective {
  private readonly el = inject(ElementRef<HTMLImageElement>);
  @Input() appImgFallback = FALLBACK_IMAGE;
  private applied = false;

  @HostListener('error')
  onError(): void {
    if (this.applied) return;
    this.applied = true;
    this.el.nativeElement.src = this.appImgFallback || FALLBACK_IMAGE;
  }
}
