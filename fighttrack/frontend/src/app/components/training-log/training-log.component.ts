import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { TrainingLog, TrainingLogForm } from '../../models/models';

@Component({
  selector: 'app-training-log',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Training Log</h1>
          <p class="subtitle">Track every session, build the discipline</p>
        </div>
        <button class="btn-primary" (click)="toggleForm()">
          {{ showForm ? '✕ Cancel' : '+ New Session' }}
        </button>
      </div>

      @if (errorMsg) {
        <div class="alert alert-error">{{ errorMsg }}</div>
      }
      @if (successMsg) {
        <div class="alert alert-success">{{ successMsg }}</div>
      }

      <!-- Create / Edit form -->
      @if (showForm) {
        <div class="card form-card">
          <h2>{{ editingId ? 'Edit Session' : 'Log New Session' }}</h2>
          <form (ngSubmit)="onSubmit()">
            <div class="form-row">
              <div class="form-group">
                <label>Title</label>
                <input type="text" [(ngModel)]="form.title" name="title" placeholder="e.g. Morning Jab Drills" required />
              </div>
              <div class="form-group">
                <label>Date</label>
                <input type="date" [(ngModel)]="form.date" name="date" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Focus Area</label>
                <select [(ngModel)]="form.focus" name="focus" required>
                  <option value="">Select focus</option>
                  <option value="striking">Striking</option>
                  <option value="grappling">Grappling</option>
                  <option value="conditioning">Conditioning</option>
                  <option value="sparring">Sparring</option>
                  <option value="technique">Technique Drills</option>
                </select>
              </div>
              <div class="form-group">
                <label>Duration (minutes)</label>
                <input type="number" [(ngModel)]="form.duration_minutes" name="duration_minutes" min="1" max="600" required />
              </div>
            </div>

            <div class="form-group">
              <label>Intensity (1–5): <strong>{{ form.intensity }}</strong></label>
              <input type="range" [(ngModel)]="form.intensity" name="intensity" min="1" max="5" step="1" class="range-input" />
              <div class="range-labels">
                <span>Very Light</span><span>Max Effort</span>
              </div>
            </div>

            <div class="form-group">
              <label>Notes (optional)</label>
              <textarea [(ngModel)]="form.notes" name="notes" rows="3" placeholder="What did you work on?"></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="submitting">
                @if (submitting) { Saving… } @else { {{ editingId ? 'Update Session' : 'Save Session' }} }
              </button>
              @if (editingId) {
                <button type="button" class="btn-secondary" (click)="cancelEdit()">Cancel</button>
              }
            </div>
          </form>
        </div>
      }

      <!-- Log list -->
      @if (loading) {
        <div class="loading">Loading your training logs…</div>
      } @else if (logs.length === 0) {
        <div class="empty-state">
          <span class="empty-icon">📋</span>
          <p>No training sessions yet. Log your first session above!</p>
        </div>
      } @else {
        <div class="log-grid">
          @for (log of logs; track log.id) {
            <div class="log-card">
              <div class="log-card-header">
                <span class="focus-badge" [class]="'focus-' + log.focus">{{ log.focus_display }}</span>
                <span class="log-date">{{ log.date }}</span>
              </div>
              <h3 class="log-title">{{ log.title }}</h3>
              <div class="log-stats">
                <span>⏱ {{ log.duration_minutes }} min</span>
                <span>🔥 Intensity {{ log.intensity }}/5</span>
              </div>
              @if (log.notes) {
                <p class="log-notes">{{ log.notes }}</p>
              }
              <div class="log-actions">
                <button class="btn-icon" (click)="startEdit(log)" title="Edit">✏️</button>
                <button class="btn-icon btn-danger" (click)="deleteLog(log.id)" title="Delete">🗑️</button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 960px; margin: 0 auto; padding: 2rem 1.5rem; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    h1 { font-family: 'Bebas Neue', sans-serif; font-size: 2rem; letter-spacing: .06em; margin: 0 0 .25rem; color: var(--text); }
    .subtitle { color: var(--text-muted); margin: 0; font-size: .9rem; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .form-card h2 { font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; letter-spacing: .08em; color: var(--text-muted); margin: 0 0 1.25rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1.1rem; }
    label { display: block; font-size: .78rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); margin-bottom: .4rem; }
    input, select, textarea {
      width: 100%; padding: .65rem 1rem; border-radius: 8px; border: 1px solid var(--border);
      background: var(--bg); color: var(--text); font-size: .95rem; box-sizing: border-box;
      transition: border-color .2s; font-family: inherit;
    }
    input:focus, select:focus, textarea:focus { outline: none; border-color: var(--accent); }
    textarea { resize: vertical; }
    .range-input { width: 100%; accent-color: var(--accent); cursor: pointer; }
    .range-labels { display: flex; justify-content: space-between; font-size: .75rem; color: var(--text-muted); margin-top: .25rem; }
    .form-actions { display: flex; gap: .75rem; margin-top: .5rem; }
    .btn-primary {
      padding: .65rem 1.4rem; border-radius: 8px; border: none;
      background: var(--accent); color: #000; font-size: .9rem; font-weight: 700;
      cursor: pointer; transition: background .2s;
    }
    .btn-primary:hover:not(:disabled) { background: var(--accent-light); }
    .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
    .btn-secondary {
      padding: .65rem 1.2rem; border-radius: 8px; border: 1px solid var(--border);
      background: transparent; color: var(--text); font-size: .9rem; cursor: pointer;
    }
    .log-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .log-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; }
    .log-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: .75rem; }
    .focus-badge {
      padding: .25rem .6rem; border-radius: 6px; font-size: .72rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .05em;
      background: var(--border); color: var(--text-muted);
    }
    .focus-striking { background: rgba(239,68,68,.2); color: #f87171; }
    .focus-grappling { background: rgba(59,130,246,.2); color: #60a5fa; }
    .focus-conditioning { background: rgba(34,197,94,.2); color: #4ade80; }
    .focus-sparring { background: rgba(251,146,60,.2); color: #fb923c; }
    .focus-technique { background: rgba(168,85,247,.2); color: #c084fc; }
    .log-date { font-size: .78rem; color: var(--text-muted); }
    .log-title { font-weight: 700; color: var(--text); margin: 0 0 .5rem; font-size: 1rem; }
    .log-stats { display: flex; gap: 1rem; font-size: .82rem; color: var(--text-muted); margin-bottom: .5rem; }
    .log-notes { font-size: .85rem; color: var(--text-muted); margin: .5rem 0; font-style: italic; line-clamp: 2; overflow: hidden; }
    .log-actions { display: flex; gap: .5rem; justify-content: flex-end; margin-top: .75rem; border-top: 1px solid var(--border); padding-top: .75rem; }
    .btn-icon { background: none; border: 1px solid var(--border); border-radius: 6px; padding: .3rem .6rem; cursor: pointer; font-size: .9rem; transition: border-color .2s; }
    .btn-icon:hover { border-color: var(--text-muted); }
    .btn-icon.btn-danger:hover { border-color: var(--danger); }
    .loading, .empty-state { text-align: center; padding: 3rem; color: var(--text-muted); }
    .empty-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
    .alert { padding: .75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: .9rem; }
    .alert-error { background: rgba(239,68,68,.15); border: 1px solid rgba(239,68,68,.4); color: #f87171; }
    .alert-success { background: rgba(34,197,94,.15); border: 1px solid rgba(34,197,94,.4); color: #4ade80; }
  `],
})
export class TrainingLogComponent implements OnInit {
  logs: TrainingLog[] = [];
  showForm = false;
  loading = true;
  submitting = false;
  editingId: number | null = null;
  errorMsg = '';
  successMsg = '';

  form: TrainingLogForm = this.emptyForm();

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.loadLogs(); }

  loadLogs(): void {
    this.loading = true;
    this.api.getTrainingLogs().subscribe({
      next: (logs) => { this.logs = logs; this.loading = false; },
      error: () => { this.errorMsg = 'Failed to load training logs.'; this.loading = false; },
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.cancelEdit();
  }

  onSubmit(): void {
    this.errorMsg = '';
    this.successMsg = '';
    this.submitting = true;

    const request = this.editingId
      ? this.api.updateTrainingLog(this.editingId, this.form)
      : this.api.createTrainingLog(this.form);

    request.subscribe({
      next: () => {
        this.successMsg = this.editingId ? 'Session updated!' : 'Session logged!';
        this.cancelEdit();
        this.showForm = false;
        this.loadLogs();
        this.submitting = false;
      },
      error: (err) => {
        this.errorMsg = err.error ? JSON.stringify(err.error) : 'Failed to save session.';
        this.submitting = false;
      },
    });
  }

  startEdit(log: TrainingLog): void {
    this.editingId = log.id;
    this.form = {
      title: log.title, focus: log.focus,
      duration_minutes: log.duration_minutes, intensity: log.intensity,
      notes: log.notes, date: log.date,
    };
    this.showForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form = this.emptyForm();
  }

  deleteLog(id: number): void {
    if (!confirm('Delete this training session?')) return;
    this.api.deleteTrainingLog(id).subscribe({
      next: () => { this.successMsg = 'Session deleted.'; this.loadLogs(); },
      error: () => this.errorMsg = 'Failed to delete session.',
    });
  }

  private emptyForm(): TrainingLogForm {
    return { title: '', focus: 'striking', duration_minutes: 60, intensity: 3, notes: '', date: new Date().toISOString().split('T')[0] };
  }
}
