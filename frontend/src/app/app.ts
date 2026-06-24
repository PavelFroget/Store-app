import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { Subscription } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { CartService } from './services/cart';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit, OnDestroy {
  cartItems: any[] = [];
  cartVisible = false;
  userName: string = '';
  private userSubscription?: Subscription;

  isHeaderVisible: boolean = true;
  private lastScrollY: number = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private http: HttpClient,
    private cartService: CartService
  ) {}

  ngOnInit(): void {

    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.cdr.detectChanges();
    });
    
    this.userSubscription = this.authService.user$.subscribe(user => {
      this.ngZone.run(() => {
        if (user) {
          this.userName = user.name || 'Без имени';
        } else {
          this.userName = '';
        }
        this.cdr.detectChanges();
      });
    });
    
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logout(): void {
    this.authService.logout();
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  get cartItemsCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  toggleCart(): void {
    this.cartVisible = !this.cartVisible;
  }

  addToCart(product: any): void {
    this.cartService.addToCart(product);
  }

  removeFromCart(productId: number): void {
    this.cartService.removeFromCart(productId);
  }

  getTotal(): number {
    return this.cartService.getTotal();
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  checkout(): void {
    if (this.cartItems.length === 0) {
      alert('Корзина пуста!');
      return;
    }
    if (!this.isLoggedIn) {
      alert('Войдите, чтобы оформить заказ.');
      this.router.navigate(['/login']);
      return;
    }

    const items = this.cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      purchase_price: item.price
    }));

    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post('http://localhost:8000/orders', { items }, { headers })
      .subscribe({
        next: (response: any) => {
          alert(`✅ Заказ оформлен! Сумма: ${response.total} ₽. Номер заказа: ${response.order_id}`);
          this.cartItems = [];
          this.cartVisible = false;
          this.router.navigate(['/orders']);
        },
        error: (err) => {
          console.error('Ошибка при оформлении заказа:', err);
          alert('❌ Не удалось оформить заказ. Попробуйте позже.');
        }
      });
  }
}