import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BannerSliderComponent } from './banner-slider';

describe('BannerSliderComponent', () => {
  let component: BannerSliderComponent;
  let fixture: ComponentFixture<BannerSliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BannerSliderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BannerSliderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
