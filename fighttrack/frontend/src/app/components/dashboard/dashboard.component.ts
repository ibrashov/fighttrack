import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { TrainingLog, TrainingStats, User } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule,RouterLink],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Welcome back, <span class="highlight">{{ username() }}</span></h1>
          <p class="subtitle">Here's your training overview</p>
        </div>
      </header>

      @if (errorMsg) {
        <div class="alert alert-error">{{ errorMsg }}</div>
      }

      @if (profileUser) {
        <section class="profile-strip card">
          <div class="profile-summary">
            <span class="summary-label">Rating</span>
            <strong>{{ profileUser.profile?.rating ?? 0 }}</strong>
          </div>
          <div class="profile-summary">
            <span class="summary-label">Main Martial Art</span>
            <strong>{{ profileUser.profile?.primary_martial_art || 'Not set' }}</strong>
          </div>
          <div class="profile-summary">
            <span class="summary-label">Experience</span>
            <strong>{{ profileUser.display_experience || 'Complete profile' }}</strong>
          </div>
          <div class="profile-summary">
            <span class="summary-label">Latest Achievement</span>
            <strong>{{ profileUser.latest_achievement || (profileUser.profile?.achievements_count ? profileUser.profile?.achievements_count + ' total' : 'None yet') }}</strong>
          </div>
        </section>
      }

      <!-- Stats cards -->
      <section class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🏋️</div>
          <div class="stat-value">{{ stats?.total_sessions ?? '—' }}</div>
          <div class="stat-label">Total Sessions</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-value">{{ stats?.total_hours ?? '—' }}h</div>
          <div class="stat-label">Total Training Time</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⚔️</div>
          <div class="stat-value">{{ pendingCount }}</div>
          <div class="stat-label">Pending Sparring</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-value">{{ recentLog?.focus_display ?? '—' }}</div>
          <div class="stat-label">Last Focus Area</div>
        </div>
      </section>

      <!-- Focus breakdown -->
      @if (stats && hasFocusData()) {
        <section class="card">
          <h2>Training Focus Breakdown</h2>
          <div class="breakdown-list">
            @for (entry of focusEntries(); track entry[0]) {
              <div class="breakdown-row">
                <span class="focus-label">{{ entry[0] | titlecase }}</span>
                <div class="bar-track">
                  <div class="bar-fill" [style.width.%]="entry[1] / stats!.total_sessions * 100"></div>
                </div>
                <span class="focus-count">{{ entry[1] }}</span>
              </div>
            }
          </div>
        </section>
      }

      <!-- Quick links -->
      <section class="quick-links">
        <a class="quick-card" routerLink="/training">
          <span class="qc-icon">📝</span>
          <span class="qc-label">Log Training</span>
        </a>
        <a class="quick-card" routerLink="/sparring">
          <span class="qc-icon">🥋</span>
          <span class="qc-label">Sparring Requests</span>
        </a>
        <a class="quick-card" routerLink="/gyms">
          <span class="qc-icon">🏟️</span>
          <span class="qc-label">Browse Gyms</span>
        </a>
      </section>

      <!-- Recent logs -->
      @if (recentLogs.length > 0) {
        <section class="card">
          <h2>Recent Training Sessions</h2>
          <div class="log-list">
            @for (log of recentLogs; track log.id) {
              <div class="log-row">
                <div class="log-focus-badge" [class]="'focus-' + log.focus">{{ log.focus_display }}</div>
                <div class="log-info">
                  <span class="log-title">{{ log.title }}</span>
                  <span class="log-meta">{{ log.date }} · {{ log.duration_minutes }} min · Intensity {{ log.intensity }}/5</span>
                </div>
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 960px; margin: 0 auto; padding: 2rem 1.5rem; }
    .page-header { margin-bottom: 2rem; }
    h1 { font-family: 'Bebas Neue', sans-serif; font-size: 2rem; letter-spacing: .06em; margin: 0 0 .25rem; color: var(--text); }
    .highlight { color: var(--accent); }
    .subtitle { color: var(--text-muted); margin: 0; font-size: .95rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .profile-strip {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem; margin-bottom: 1.5rem;
    }
    .profile-summary {
      padding: 1rem 1.1rem; border-radius: 10px; background: rgba(255,255,255,.02);
      border: 1px solid rgba(234,179,8,.12);
    }
    .summary-label {
      display: block; font-size: .74rem; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: .08em; margin-bottom: .35rem;
    }
    .profile-summary strong { color: var(--text); font-size: .98rem; }
    .stat-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
      padding: 1.5rem; text-align: center;
    }
    .stat-icon { font-size: 1.8rem; margin-bottom: .5rem; }
    .stat-value { font-family: 'Bebas Neue', sans-serif; font-size: 2rem; color: var(--accent); letter-spacing: .04em; }
    .stat-label { font-size: .78rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; margin-top: .25rem; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    h2 { font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; letter-spacing: .08em; color: var(--text-muted); margin: 0 0 1rem; }
    .breakdown-row { display: flex; align-items: center; gap: .75rem; margin-bottom: .6rem; }
    .focus-label { width: 110px; font-size: .85rem; text-transform: capitalize; color: var(--text); }
    .bar-track { flex: 1; background: var(--border); border-radius: 99px; height: 8px; overflow: hidden; }
    .bar-fill { height: 100%; background: var(--accent); border-radius: 99px; transition: width .4s; }
    .focus-count { width: 24px; text-align: right; font-size: .85rem; color: var(--text-muted); }
    .quick-links { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .quick-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
      padding: 1.5rem; display: flex; flex-direction: column; align-items: center; gap: .5rem;
      text-decoration: none; transition: border-color .2s, transform .2s;
    }
    .quick-card:hover { border-color: var(--accent); transform: translateY(-2px); }
    .qc-icon { font-size: 2rem; }
    .qc-label { font-size: .9rem; font-weight: 600; color: var(--text); }
    .log-list { display: flex; flex-direction: column; gap: .75rem; }
    .log-row { display: flex; align-items: center; gap: 1rem; }
    .log-focus-badge {
      padding: .3rem .7rem; border-radius: 6px; font-size: .75rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .05em; white-space: nowrap;
      background: var(--border); color: var(--text-muted);
    }
    .focus-striking { background: rgba(239,68,68,.2); color: #f87171; }
    .focus-grappling { background: rgba(59,130,246,.2); color: #60a5fa; }
    .focus-conditioning { background: rgba(34,197,94,.2); color: #4ade80; }
    .focus-sparring { background: rgba(251,146,60,.2); color: #fb923c; }
    .focus-technique { background: rgba(168,85,247,.2); color: #c084fc; }
    .log-info { display: flex; flex-direction: column; }
    .log-title { font-weight: 600; color: var(--text); font-size: .95rem; }
    .log-meta { font-size: .8rem; color: var(--text-muted); margin-top: .15rem; }
    .alert { padding: .75rem 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: .9rem; }
    .alert-error { background: rgba(239,68,68,.15); border: 1px solid rgba(239,68,68,.4); color: #f87171; }
  `],
})
export class DashboardComponent implements OnInit {
  username = computed(() => this.authService.currentUser()?.username ?? '');
  stats: TrainingStats | null = null;
  profileUser: User | null = null;
  recentLogs: TrainingLog[] = [];
  pendingCount = 0;
  recentLog: TrainingLog | null = null;
  errorMsg = '';

  constructor(private api: ApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadProfile();
    this.loadRecentLogs();
    this.loadPendingSparring();
  }

  loadProfile(): void {
    this.api.getProfile().subscribe({
      next: (user) => {
        this.profileUser = user;
        this.authService.updateCurrentUser(user);
      },
      error: () => {},
    });
  }

  loadStats(): void {
    this.api.getTrainingStats().subscribe({
      next: (s) => this.stats = s,
      error: () => this.errorMsg = 'Failed to load training stats.',
    });
  }

  loadRecentLogs(): void {
    this.api.getTrainingLogs().subscribe({
      next: (logs) => {
        this.recentLogs = logs.slice(0, 5);
        this.recentLog = logs[0] ?? null;
      },
      error: () => {},
    });
  }

  loadPendingSparring(): void {
    this.api.getIncomingSparring().subscribe({
      next: (reqs) => this.pendingCount = reqs.length,
      error: () => {},
    });
  }

  hasFocusData(): boolean {
    return this.stats ? Object.keys(this.stats.focus_breakdown).length > 0 : false;
  }

  focusEntries(): [string, number][] {
    if (!this.stats) return [];
    return Object.entries(this.stats.focus_breakdown).sort((a, b) => b[1] - a[1]);
  }
}
