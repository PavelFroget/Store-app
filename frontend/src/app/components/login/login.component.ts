import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit(): void {
    this.error = '';
    this.cdr.detectChanges();

    if (!this.email || !this.password) {
      this.error = 'Заполните все поля';
      this.cdr.detectChanges();
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Ошибка входа:', err);

        let errorMessage = '';

        if (err.error && err.error.detail) {
          errorMessage = err.error.detail;
        } else if (err.error && err.error.message) {
          errorMessage = err.error.message;
        } else if (err.message) {
          errorMessage = err.message;
        } else {
          errorMessage = `Ошибка ${err.status}: ${err.statusText}`;
        }

        if (err.status === 400) {
          if (!errorMessage || errorMessage === 'Bad Request') {
            errorMessage = 'Неверный логин или пароль. Проверьте введённые данные.';
          }
        } else if (err.status === 403) {
          errorMessage = 'Пользователь заблокирован. Обратитесь к администратору.';
        } else if (err.status === 0) {
          errorMessage = 'Сервер недоступен. Проверьте подключение.';
        }

        this.error = errorMessage;
        this.cdr.detectChanges();

        console.log('Сообщение об ошибке установлено:', this.error);
      }
    });
  }
}