import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000';
  private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  private userSubject = new BehaviorSubject<any>(null);

  public loggedIn$ = this.loggedInSubject.asObservable();
  public user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    if (this.hasToken()) {
      this.fetchUser();
    }
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('access_token');
  }

  private fetchUser(): void {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    this.http.get(`${this.apiUrl}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (user) => {
        this.userSubject.next(user);
        this.loggedInSubject.next(true);
      },
      error: () => {
        this.logout();
      }
    });
  }

  register(name: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { name, email, password });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(response => {
          localStorage.setItem('access_token', response.access_token);
          this.loggedInSubject.next(true);
          this.fetchUser();
        })
      );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.loggedInSubject.next(false);
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.loggedInSubject.value;
  }
}