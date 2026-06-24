import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product';
import { BannerSliderComponent } from '../banner-slider/banner-slider';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule,BannerSliderComponent],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.css']
})
export class ProductListComponent implements OnInit {
  
  

  bannerImages: string[] = [
    'https://cdn.lemanapro.ru/lmru/image/upload/q_90/f_auto/dpr_2.0/w_1180/h_264/v1780998865/fudzi/fudzi/X4RlscqCf38EkM7hs7ddx/3540x792-1180x264.jpg/3540x792-1180x264.jpg',
    'https://cdn.lemanapro.ru/lmru/image/upload/q_90/f_auto/dpr_2.0/w_1180/h_264/v1780997212/fudzi/fudzi/qsOcWJUUdNiemZM6lZuwo/3540x792-1180x264.jpg/3540x792-1180x264.jpg',
    'https://cdn.lemanapro.ru/lmru/image/upload/q_90/f_auto/dpr_2.0/w_1180/h_264/v1774876231/fudzi/fudzi/5dbZw_2dHcvb3Yhzlpvoy/karusel.png/karusel.png',
    'https://cdn.lemanapro.ru/lmru/image/upload/q_90/f_auto/dpr_2.0/w_1180/h_264/v1775215061/fudzi/fudzi/xp6ONJ_6cw8bOzVBY1yUl/karusel-13.png/karusel-13.png'
  ];
  products: any[] = [];
  searchText = '';
  sortBy = 'default';
  loading = false;

  
  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
    private cartService: CartService
  ) {}

  ngOnInit(): void {

    this.loading = true;

    this.productService.getProducts().subscribe({
      next: (data) => {

        this.products = data || [];
        this.loading = false;
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get filteredProducts(): any[] {
    let result = this.products;

    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase().trim();
      result = result.filter(p => p.name.toLowerCase().includes(search));
    }

    if (this.sortBy === 'price-asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'price-desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (this.sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }

  onAddToCart(product: any): void {
    if (product.stock <= 0) {
      alert('Товара нет в наличии!');
      return;
    }
    this.cartService.addToCart(product);
  }

  
}