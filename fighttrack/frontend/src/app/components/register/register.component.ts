import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <span class="auth-icon">🥊</span>
          <h1>FightTrack</h1>
          <p>Create your fighter profile</p>
        </div>

        @if (errorMsg) {
          <div class="alert alert-error">{{ errorMsg }}</div>
        }
        @if (successMsg) {
          <div class="alert alert-success">{{ successMsg }}</div>
        }

        <form (ngSubmit)="onRegister()">
          <div class="form-group">
            <label>Username</label>
            <input
              type="text"
              [(ngModel)]="form.username"
              name="username"
              placeholder="fighter_name"
              required
            />
          </div>

          <div class="form-group">
            <label>Email</label>
            <input
              type="email"
              [(ngModel)]="form.email"
              name="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div class="form-group">
            <label>Password</label>
            <input
              type="password"
              [(ngModel)]="form.password"
              name="password"
              placeholder="Min. 6 characters"
              required
            />
          </div>

          <div class="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              [(ngModel)]="form.password_confirm"
              name="password_confirm"
              placeholder="Repeat password"
              required
            />
          </div>

          <button type="submit" class="btn-submit" [disabled]="loading">
            @if (loading) { Creating account… } @else { Create Account }
          </button>
        </form>

        <p class="auth-footer">
          Already a fighter? <a routerLink="/login">Sign in</a>
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
      border-radius: 16px; padding: 2.5rem; width: 100%; max-width: 420px;
      box-shadow: 0 8px 32px rgba(0,0,0,.4);
    }
    .auth-header { text-align: center; margin-bottom: 2rem; }
    .auth-icon { font-size: 2.5rem; }
    h1 { font-family: 'Bebas Neue', sans-serif; font-size: 2.2rem; color: var(--accent); margin: .25rem 0 .5rem; letter-spacing: .1em; }
    p { color: var(--text-muted); margin: 0; font-size: .9rem; }
    .form-group { margin-bottom: 1.1rem; }
    label { display: block; font-size: .78rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); margin-bottom: .35rem; }
    input {
      width: 100%; padding: .65rem 1rem; border-radius: 8px;
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
    .alert-success { background: rgba(34,197,94,.15); border: 1px solid rgba(34,197,94,.4); color: #4ade80; }
  `],
})
export class RegisterComponent {
  form: RegisterRequest = { username: '', email: '', password: '', password_confirm: '' };
  loading = false;
  errorMsg = '';
  successMsg = '';

  constructor(private auth: AuthService, private router: Router) {}

  onRegister(): void {
    this.errorMsg = '';
    this.successMsg = '';
    this.loading = true;

    this.auth.register(this.form).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        const errors = err.error;
        if (typeof errors === 'object') {
          this.errorMsg = Object.values(errors).flat().join(' ');
        } else {
          this.errorMsg = 'Registration failed. Please try again.';
        }
        this.loading = false;
      },
    });
  }
}
