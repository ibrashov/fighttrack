import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <span class="auth-icon">🥊</span>
          <h1>FightTrack</h1>
          <p>Sign in to your account</p>
        </div>

        @if (errorMsg) {
          <div class="alert alert-error">{{ errorMsg }}</div>
        }

        <form (ngSubmit)="onLogin()">
          <div class="form-group">
            <label>Username</label>
            <input
              type="text"
              [(ngModel)]="form.username"
              name="username"
              placeholder="your_username"
              required
            />
          </div>

          <div class="form-group">
            <label>Password</label>
            <input
              type="password"
              [(ngModel)]="form.password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" class="btn-submit" [disabled]="loading">
            @if (loading) { Signing in… } @else { Sign In }
          </button>
        </form>

        <p class="auth-footer">
          No account? <a routerLink="/register">Register here</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: var(--bg); padding: 2rem;
    }
    .auth-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 16px; padding: 2.5rem; width: 100%; max-width: 400px;
      box-shadow: 0 8px 32px rgba(0,0,0,.4);
    }
    .auth-header { text-align: center; margin-bottom: 2rem; }
    .auth-icon { font-size: 2.5rem; }
    h1 { font-family: 'Bebas Neue', sans-serif; font-size: 2.2rem; color: var(--accent); margin: .25rem 0 .5rem; letter-spacing: .1em; }
    p { color: var(--text-muted); margin: 0; font-size: .9rem; }
    .form-group { margin-bottom: 1.25rem; }
    label { display: block; font-size: .8rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); margin-bottom: .4rem; }
    input {
      width: 100%; padding: .7rem 1rem; border-radius: 8px;
      border: 1px solid var(--border); background: var(--bg);
      color: var(--text); font-size: .95rem; box-sizing: border-box;
      transition: border-color .2s;
    }
    input:focus { outline: none; border-color: var(--accent); }
    .btn-submit {
      width: 100%; padding: .8rem; border-radius: 8px; border: none;
      background: var(--accent); color: #000; font-size: 1rem; font-weight: 700;
      cursor: pointer; margin-top: .5rem; transition: background .2s;
    }
    .btn-submit:hover:not(:disabled) { background: var(--accent-light); }
    .btn-submit:disabled { opacity: .6; cursor: not-allowed; }
    .auth-footer { text-align: center; margin-top: 1.5rem; color: var(--text-muted); font-size: .9rem; }
    .auth-footer a { color: var(--accent); text-decoration: none; }
    .alert { padding: .75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: .9rem; }
    .alert-error { background: rgba(239,68,68,.15); border: 1px solid rgba(239,68,68,.4); color: #f87171; }
  `],
})
export class LoginComponent {
  form: LoginRequest = { username: '', password: '' };
  loading = false;
  errorMsg = '';

  constructor(private auth: AuthService, private router: Router) {}

  onLogin(): void {
    this.errorMsg = '';
    this.loading = true;
    this.auth.login(this.form).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.errorMsg = err.error?.error ?? err.error?.non_field_errors?.[0] ?? 'Login failed. Check your credentials.';
        this.loading = false;
      },
    });
  }
}
