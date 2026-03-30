import { Component, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <a class="brand" routerLink="/dashboard">
        <span class="brand-icon">🥊</span>
        <span class="brand-name">FightTrack</span>
      </a>

      @if (isLoggedIn()) {
        <ul class="nav-links">
          <li><a routerLink="/dashboard" routerLinkActive="active">Dashboard</a></li>
          <li><a routerLink="/training" routerLinkActive="active">Training</a></li>
          <li><a routerLink="/sparring" routerLinkActive="active">Sparring</a></li>
          <li><a routerLink="/gyms" routerLinkActive="active">Gyms</a></li>
        </ul>
        <div class="nav-right">
          <a class="username" routerLink="/profile" routerLinkActive="active-link">{{ username() }}</a>
          <button class="btn-logout" (click)="logout()">Logout</button>
        </div>
      } @else {
        <div class="nav-right">
          <a class="btn-nav" routerLink="/login">Login</a>
          <a class="btn-nav btn-primary" routerLink="/register">Register</a>
        </div>
      }
    </nav>
  `,
  styles: [`
    .navbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      display: flex; align-items: center; gap: 2rem;
      padding: 0 2rem; height: 64px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      box-shadow: 0 2px 12px rgba(0,0,0,.35);
    }
    .brand { display: flex; align-items: center; gap: .5rem; text-decoration: none; }
    .brand-icon { font-size: 1.5rem; }
    .brand-name { font-family: 'Bebas Neue', sans-serif; font-size: 1.6rem; letter-spacing: .08em; color: var(--accent); }
    .nav-links { display: flex; list-style: none; gap: .25rem; margin: 0; padding: 0; flex: 1; }
    .nav-links a {
      padding: .4rem .9rem; border-radius: 6px;
      color: var(--text-muted); text-decoration: none; font-size: .9rem; font-weight: 500;
      transition: color .2s, background .2s;
    }
    .nav-links a:hover, .nav-links a.active { color: var(--text); background: var(--border); }
    .nav-links a.active { color: var(--accent); }
    .nav-right { display: flex; align-items: center; gap: .75rem; margin-left: auto; }
    .username {
      color: var(--text-muted); font-size: .85rem; text-decoration: none;
      padding: .35rem .7rem; border-radius: 999px; border: 1px solid transparent; transition: all .2s;
    }
    .username:hover, .username.active-link {
      color: var(--accent); border-color: rgba(234,179,8,.25); background: rgba(234,179,8,.08);
    }
    .btn-logout {
      padding: .35rem .9rem; border-radius: 6px; border: 1px solid var(--border);
      background: transparent; color: var(--text-muted); cursor: pointer; font-size: .85rem;
      transition: all .2s;
    }
    .btn-logout:hover { border-color: var(--danger); color: var(--danger); }
    .btn-nav {
      padding: .4rem 1rem; border-radius: 6px; text-decoration: none;
      font-size: .85rem; font-weight: 600; color: var(--text-muted);
      border: 1px solid var(--border); transition: all .2s;
    }
    .btn-nav:hover { color: var(--text); border-color: var(--text-muted); }
    .btn-nav.btn-primary { background: var(--accent); color: #000; border-color: var(--accent); }
    .btn-nav.btn-primary:hover { background: var(--accent-light); }
  `],
})
export class NavbarComponent {
  isLoggedIn = computed(() => !!this.auth.currentUser());
  username = computed(() => this.auth.currentUser()?.username ?? '');

  constructor(private auth: AuthService) {}

  logout(): void {
    this.auth.logout();
  }
}
