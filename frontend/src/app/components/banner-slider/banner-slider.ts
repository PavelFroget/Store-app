import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-banner-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './banner-slider.html',
  styleUrls: ['./banner-slider.css']
})
export class BannerSliderComponent implements OnInit, OnDestroy {
  @Input() images: string[] = []; 
  @Input() autoPlay: boolean = true;
  @Input() interval: number = 4000;

  currentIndex = 0;
  private timer: any;

  ngOnInit(): void {
    if (this.autoPlay && this.images.length > 1) {
      this.startAutoPlay();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  goTo(index: number): void {
    this.currentIndex = (index + this.images.length) % this.images.length;
  }

  next(): void {
    this.goTo(this.currentIndex + 1);
  }

  prev(): void {
    this.goTo(this.currentIndex - 1);
  }

  startAutoPlay(): void {
    this.timer = setInterval(() => this.next(), this.interval);
  }

  stopAutoPlay(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  pauseAutoPlay(): void {
    if (this.autoPlay) this.stopAutoPlay();
  }

  resumeAutoPlay(): void {
    if (this.autoPlay) this.startAutoPlay();
  }
}