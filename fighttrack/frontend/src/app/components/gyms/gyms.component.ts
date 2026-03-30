import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Gym, GymForm } from '../../models/models';

@Component({
  selector: 'app-gyms',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Gyms & Locations</h1>
          <p class="subtitle">Find places to train and spar</p>
        </div>
        <button class="btn-primary" (click)="toggleForm()">
          {{ showForm ? '✕ Cancel' : '+ Add Gym' }}
        </button>
      </div>

      @if (errorMsg) { <div class="alert alert-error">{{ errorMsg }}</div> }
      @if (successMsg) { <div class="alert alert-success">{{ successMsg }}</div> }

      <!-- Search bar -->
      <div class="search-bar">
        <input
          type="text"
          [(ngModel)]="cityFilter"
          name="cityFilter"
          placeholder="🔍 Filter by city…"
          (input)="onSearch()"
        />
      </div>

      <!-- Add gym form -->
      @if (showForm) {
        <div class="card form-card">
          <h2>{{ editingId ? 'Edit Gym' : 'Add New Gym' }}</h2>
          <form (ngSubmit)="onSubmit()">
            <div class="form-row">
              <div class="form-group">
                <label>Gym Name</label>
                <input type="text" [(ngModel)]="form.name" name="name" placeholder="Tiger Muay Thai" required />
              </div>
              <div class="form-group">
                <label>City</label>
                <input type="text" [(ngModel)]="form.city" name="city" placeholder="Almaty" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Country</label>
                <input type="text" [(ngModel)]="form.country" name="country" placeholder="Kazakhstan" />
              </div>
              <div class="form-group">
                <label>Address</label>
                <input type="text" [(ngModel)]="form.address" name="address" placeholder="Street, Building" required />
              </div>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="form.description" name="description" rows="2" placeholder="What makes this gym great?"></textarea>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="submitting">
                @if (submitting) { Saving… } @else { {{ editingId ? 'Update Gym' : 'Add Gym' }} }
              </button>
              @if (editingId) {
                <button type="button" class="btn-secondary" (click)="cancelEdit()">Cancel</button>
              }
            </div>
          </form>
        </div>
      }

      <!-- Gym grid -->
      @if (loading) {
        <div class="loading">Loading gyms…</div>
      } @else if (gyms.length === 0) {
        <div class="empty-state">
          <span class="empty-icon">🏟️</span>
          <p>No gyms found{{ cityFilter ? ' for "' + cityFilter + '"' : '' }}. Add one!</p>
        </div>
      } @else {
        <div class="gym-grid">
          @for (gym of gyms; track gym.id) {
            <div class="gym-card">
              <div class="gym-card-header">
                <h3>{{ gym.name }}</h3>
                <span class="city-tag">{{ gym.city }}</span>
              </div>
              <p class="gym-address">📍 {{ gym.address }}, {{ gym.country }}</p>
              @if (gym.description) {
                <p class="gym-desc">{{ gym.description }}</p>
              }
              <div class="gym-actions">
                <button class="btn-icon" (click)="startEdit(gym)" title="Edit">✏️ Edit</button>
                <button class="btn-icon btn-danger" (click)="deleteGym(gym.id)" title="Delete">🗑️</button>
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
    .search-bar { margin-bottom: 1.25rem; }
    .search-bar input {
      width: 100%; max-width: 340px; padding: .65rem 1rem; border-radius: 8px;
      border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: .95rem;
      box-sizing: border-box;
    }
    .search-bar input:focus { outline: none; border-color: var(--accent); }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .form-card h2 { font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; letter-spacing: .08em; color: var(--text-muted); margin: 0 0 1.25rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1.1rem; }
    label { display: block; font-size: .78rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); margin-bottom: .4rem; }
    input, textarea {
      width: 100%; padding: .65rem 1rem; border-radius: 8px; border: 1px solid var(--border);
      background: var(--bg); color: var(--text); font-size: .95rem; box-sizing: border-box;
      font-family: inherit; transition: border-color .2s;
    }
    input:focus, textarea:focus { outline: none; border-color: var(--accent); }
    textarea { resize: vertical; }
    .form-actions { display: flex; gap: .75rem; }
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
    .gym-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .gym-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; }
    .gym-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: .5rem; gap: .5rem; }
    h3 { font-weight: 700; color: var(--text); margin: 0; font-size: 1rem; }
    .city-tag { background: rgba(234,179,8,.15); color: var(--accent); border-radius: 6px; padding: .2rem .55rem; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; white-space: nowrap; }
    .gym-address { font-size: .82rem; color: var(--text-muted); margin: 0 0 .5rem; }
    .gym-desc { font-size: .85rem; color: var(--text-muted); margin: 0 0 .75rem; font-style: italic; }
    .gym-actions { display: flex; gap: .5rem; justify-content: flex-end; border-top: 1px solid var(--border); padding-top: .75rem; margin-top: .5rem; }
    .btn-icon { background: none; border: 1px solid var(--border); border-radius: 6px; padding: .3rem .7rem; cursor: pointer; font-size: .82rem; color: var(--text-muted); transition: border-color .2s; }
    .btn-icon:hover { border-color: var(--text-muted); color: var(--text); }
    .btn-icon.btn-danger:hover { border-color: var(--danger); color: var(--danger); }
    .loading, .empty-state { text-align: center; padding: 3rem; color: var(--text-muted); }
    .empty-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
    .alert { padding: .75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: .9rem; }
    .alert-error { background: rgba(239,68,68,.15); border: 1px solid rgba(239,68,68,.4); color: #f87171; }
    .alert-success { background: rgba(34,197,94,.15); border: 1px solid rgba(34,197,94,.4); color: #4ade80; }
  `],
})
export class GymsComponent implements OnInit {
  gyms: Gym[] = [];
  showForm = false;
  loading = true;
  submitting = false;
  editingId: number | null = null;
  cityFilter = '';
  errorMsg = '';
  successMsg = '';

  form: GymForm = this.emptyForm();

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.loadGyms(); }

  loadGyms(): void {
    this.loading = true;
    this.api.getGyms(this.cityFilter).subscribe({
      next: (g) => { this.gyms = g; this.loading = false; },
      error: () => { this.errorMsg = 'Failed to load gyms.'; this.loading = false; },
    });
  }

  onSearch(): void { this.loadGyms(); }
  toggleForm(): void { this.showForm = !this.showForm; if (!this.showForm) this.cancelEdit(); }

  onSubmit(): void {
    this.errorMsg = '';
    this.submitting = true;
    const req = this.editingId
      ? this.api.updateGym(this.editingId, this.form)
      : this.api.createGym(this.form);

    req.subscribe({
      next: () => {
        this.successMsg = this.editingId ? 'Gym updated!' : 'Gym added!';
        this.cancelEdit();
        this.showForm = false;
        this.loadGyms();
        this.submitting = false;
      },
      error: (err) => {
        this.errorMsg = err.error ? JSON.stringify(err.error) : 'Failed to save gym.';
        this.submitting = false;
      },
    });
  }

  startEdit(gym: Gym): void {
    this.editingId = gym.id;
    this.form = { name: gym.name, address: gym.address, city: gym.city, country: gym.country, description: gym.description };
    this.showForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void { this.editingId = null; this.form = this.emptyForm(); }

  deleteGym(id: number): void {
    if (!confirm('Remove this gym?')) return;
    this.api.deleteGym(id).subscribe({
      next: () => { this.successMsg = 'Gym removed.'; this.loadGyms(); },
      error: () => this.errorMsg = 'Failed to remove gym.',
    });
  }

  private emptyForm(): GymForm {
    return { name: '', address: '', city: '', country: 'Kazakhstan', description: '' };
  }
}
