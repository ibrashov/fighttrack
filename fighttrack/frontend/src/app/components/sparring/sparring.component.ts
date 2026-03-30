import { CommonModule } from '@angular/common';
import { Component, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  Gym,
  MARTIAL_ART_OPTIONS,
  SPARRING_DURATION_OPTIONS,
  SparringRequest,
  SparringRequestForm,
  User,
} from '../../models/models';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

const EXPERIENCE_GAP_LIMIT_MONTHS = 6;
const INCOMPLETE_PROFILE_MESSAGE = 'Complete your profile experience before sending a challenge.';
const EXPERIENCE_GAP_MESSAGE = 'Please choose an opponent with closer experience. The experience gap must not exceed 6 months.';

@Component({
  selector: 'app-sparring',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Sparring Requests</h1>
          <p class="subtitle">Challenge opponents, accept fights, sharpen your game</p>
        </div>
        <button class="btn-primary" (click)="toggleForm()">
          {{ showForm ? 'Cancel' : '+ Challenge Someone' }}
        </button>
      </div>

      @if (errorMsg) { <div class="alert alert-error">{{ errorMsg }}</div> }
      @if (successMsg) { <div class="alert alert-success">{{ successMsg }}</div> }

      @if (showForm) {
        <div class="card form-card">
          <div class="section-head">
            <div>
              <h2>New Sparring Challenge</h2>
              <p>Choose a close-match opponent and keep the session details clear.</p>
            </div>
          </div>

          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label>Opponent</label>
              <div class="opponent-grid">
                @for (u of users; track u.id) {
                  <button
                    type="button"
                    class="opponent-card"
                    [class.selected]="form.opponent_id === u.id"
                    (click)="selectOpponent(u.id)"
                  >
                    <div class="opponent-top">
                      <strong>{{ u.username }}</strong>
                      <span class="rating">Rating {{ u.profile?.rating ?? 0 }}</span>
                    </div>
                    <div class="opponent-meta">{{ u.profile?.primary_martial_art || 'No main style' }}</div>
                    <div class="opponent-meta">Experience: {{ userExperienceLabel(u, form.martial_art) }}</div>
                    @if (u.latest_achievement) {
                      <div class="achievement-badge">{{ u.latest_achievement }}</div>
                    }
                  </button>
                }
              </div>
            </div>

            @if (selectedOpponent()) {
              <div class="selection-summary">
                <div>
                  <span class="summary-title">Selected opponent</span>
                  <strong>{{ selectedOpponent()!.username }}</strong>
                </div>
                <div>
                  <span class="summary-title">Matched martial art</span>
                  <strong>{{ resolvedMartialArt() || 'Primary profile art' }}</strong>
                </div>
                <div>
                  <span class="summary-title">Experience gap</span>
                  <strong>{{ experienceGapLabel() }}</strong>
                </div>
              </div>
            }

            <div class="form-row">
              <div class="form-group">
                <label>Gym / Location</label>
                <select [(ngModel)]="form.gym_id" name="gym_id" required>
                  <option [ngValue]="0">Select gym</option>
                  @for (g of gyms; track g.id) {
                    <option [ngValue]="g.id">{{ g.name }} - {{ g.city }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Martial Art Type</label>
                <select [(ngModel)]="form.martial_art" name="martial_art" required>
                  <option value="">Select martial art</option>
                  @for (option of martialArtOptions; track option) {
                    <option [value]="option">{{ option }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Proposed Date</label>
                <input type="date" [(ngModel)]="form.proposed_date" name="proposed_date" required />
              </div>
              <div class="form-group">
                <label>Proposed Time</label>
                <input type="time" [(ngModel)]="form.proposed_time" name="proposed_time" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Sparring Duration</label>
                <input type="text" list="duration-options" [(ngModel)]="form.duration" name="duration" placeholder="3 rounds x 2 min" required />
              </div>
              <div class="form-group">
                <label>Equipment Notes</label>
                <input type="text" [(ngModel)]="form.equipment_notes" name="equipment_notes" placeholder="Bring 16 oz gloves" />
              </div>
            </div>

            <div class="reminder-box">
              <div class="reminder-title">Equipment Reminder</div>
              <p>Reminder: mouthguard, gloves, shin guards, headgear if needed.</p>
              @if (currentUser?.profile?.equipment_notes) {
                <span class="reminder-note">Your profile note: {{ currentUser?.profile?.equipment_notes }}</span>
              }
            </div>

            <div class="form-group">
              <label>Message</label>
              <textarea [(ngModel)]="form.message" name="message" rows="3" placeholder="Let's keep it technical, medium pace."></textarea>
            </div>

            @if (challengeBlockedReason()) {
              <div class="inline-error">{{ challengeBlockedReason() }}</div>
            }

            <button type="submit" class="btn-primary" [disabled]="submitting || !isFormValid()">
              {{ submitting ? 'Sending...' : 'Send Challenge' }}
            </button>
          </form>

          <datalist id="duration-options">
            @for (option of durationOptions; track option) {
              <option [value]="option"></option>
            }
          </datalist>
        </div>
      }

      <div class="tabs">
        <button class="tab" [class.active]="activeTab === 'incoming'" (click)="activeTab = 'incoming'">
          Incoming <span class="badge">{{ incoming.length }}</span>
        </button>
        <button class="tab" [class.active]="activeTab === 'sent'" (click)="activeTab = 'sent'">
          Sent
        </button>
        <button class="tab" [class.active]="activeTab === 'all'" (click)="activeTab = 'all'">
          All
        </button>
      </div>

      @if (loading) {
        <div class="loading">Loading sparring requests...</div>
      } @else {
        <div class="request-list">
          @for (req of filteredRequests(); track req.id) {
            <div class="req-card" [class]="'status-' + req.status">
              <div class="req-header">
                <div class="req-parties">
                  <span class="party initiator">{{ req.initiator_username }}</span>
                  <span class="vs">vs</span>
                  <span class="party opponent">{{ req.opponent_username }}</span>
                </div>
                <span class="status-badge" [class]="'s-' + req.status">{{ req.status_display }}</span>
              </div>

              <div class="req-details">
                <span>{{ req.gym_detail.name }}</span>
                <span>{{ req.proposed_date }} at {{ req.proposed_time }}</span>
                <span>{{ req.martial_art || 'General sparring' }}</span>
                <span>{{ req.duration || 'Duration TBD' }}</span>
              </div>

              @if (req.equipment_notes) {
                <div class="req-note">Equipment: {{ req.equipment_notes }}</div>
              }

              @if (req.message) {
                <p class="req-message">"{{ req.message }}"</p>
              }

              @if (req.status === 'pending') {
                <div class="req-actions">
                  @if (req.opponent === currentUserId()) {
                    <button class="btn-accept" (click)="respond(req.id, 'accepted')">Accept</button>
                    <button class="btn-decline" (click)="respond(req.id, 'declined')">Decline</button>
                  }
                  @if (req.initiator === currentUserId()) {
                    <button class="btn-cancel" (click)="cancel(req.id)">Cancel</button>
                  }
                </div>
              }
            </div>
          } @empty {
            <div class="empty-state">
              <span class="empty-icon">No sparring requests yet.</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [``],
})
export class SparringComponent implements OnInit {
  requests: SparringRequest[] = [];
  incoming: SparringRequest[] = [];
  users: User[] = [];
  gyms: Gym[] = [];
  currentUser: User | null = null;
  showForm = false;
  loading = true;
  submitting = false;
  activeTab: 'incoming' | 'sent' | 'all' = 'incoming';
  errorMsg = '';
  successMsg = '';
  martialArtOptions = [...MARTIAL_ART_OPTIONS];
  durationOptions = [...SPARRING_DURATION_OPTIONS];

  currentUserId = computed(() => this.auth.currentUser()?.id ?? 0);

  form: SparringRequestForm = this.emptyForm();

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.loadAll();
    this.loadFormDependencies();
  }

  loadAll(): void {
    this.loading = true;
    this.api.getSparringRequests().subscribe({
      next: (reqs) => {
        this.requests = reqs;
        this.incoming = reqs.filter(r => r.opponent === this.currentUserId() && r.status === 'pending');
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Failed to load sparring requests.';
        this.loading = false;
      },
    });
  }

  loadFormDependencies(): void {
    this.api.getProfile().subscribe({
      next: user => {
        this.currentUser = user;
        this.auth.updateCurrentUser(user);
      },
    });
    this.api.getUsers().subscribe({ next: users => this.users = users });
    this.api.getGyms().subscribe({ next: gyms => this.gyms = gyms });
  }

  filteredRequests(): SparringRequest[] {
    const uid = this.currentUserId();
    if (this.activeTab === 'incoming') return this.requests.filter(r => r.opponent === uid);
    if (this.activeTab === 'sent') return this.requests.filter(r => r.initiator === uid);
    return this.requests;
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    this.errorMsg = '';
    this.successMsg = '';
  }

  selectOpponent(userId: number): void {
    this.form.opponent_id = userId;
  }

  selectedOpponent(): User | undefined {
    return this.users.find(user => user.id === this.form.opponent_id);
  }

  resolvedMartialArt(): string {
    return this.form.martial_art.trim() || this.currentUser?.profile?.primary_martial_art || '';
  }

  experienceGapLabel(): string {
    const opponent = this.selectedOpponent();
    if (!this.currentUser || !opponent) {
      return 'Select an opponent';
    }

    const ownMonths = this.resolveExperienceMonths(this.currentUser, this.resolvedMartialArt());
    const opponentMonths = this.resolveExperienceMonths(opponent, this.resolvedMartialArt());
    if (ownMonths == null || opponentMonths == null) {
      return 'Incomplete profile';
    }

    const gap = Math.abs(ownMonths - opponentMonths);
    return `${gap} month${gap === 1 ? '' : 's'}`;
  }

  challengeBlockedReason(): string {
    const opponent = this.selectedOpponent();
    if (!this.form.opponent_id || !opponent) {
      return '';
    }

    const martialArt = this.resolvedMartialArt();
    const ownMonths = this.resolveExperienceMonths(this.currentUser, martialArt);
    const opponentMonths = this.resolveExperienceMonths(opponent, martialArt);

    if (ownMonths == null || opponentMonths == null) {
      return INCOMPLETE_PROFILE_MESSAGE;
    }

    if (Math.abs(ownMonths - opponentMonths) > EXPERIENCE_GAP_LIMIT_MONTHS) {
      return EXPERIENCE_GAP_MESSAGE;
    }

    return '';
  }

  userExperienceLabel(user: User, martialArt: string): string {
    const target = martialArt.trim() || user.profile?.primary_martial_art || '';
    const match = user.experiences.find(item =>
      item.martial_art.trim().toLowerCase() === target.trim().toLowerCase(),
    ) ?? user.experiences.find(item =>
      item.martial_art.trim().toLowerCase() === (user.profile?.primary_martial_art || '').trim().toLowerCase(),
    ) ?? user.experiences[0];

    if (!match) {
      return 'Profile incomplete';
    }

    const parts: string[] = [];
    if (match.years) {
      parts.push(`${match.years}y`);
    }
    if (match.months) {
      parts.push(`${match.months}m`);
    }
    return parts.join(' ') || '0m';
  }

  isFormValid(): boolean {
    return Boolean(
      this.form.opponent_id &&
      this.form.gym_id &&
      this.form.proposed_date &&
      this.form.proposed_time &&
      this.form.martial_art.trim() &&
      this.form.duration.trim() &&
      !this.challengeBlockedReason(),
    );
  }

  onSubmit(): void {
    this.errorMsg = '';
    this.successMsg = '';

    if (!this.isFormValid()) {
      this.errorMsg = this.challengeBlockedReason() || 'Please complete all required fields before sending a challenge.';
      return;
    }

    this.submitting = true;
    this.api.createSparringRequest(this.form).subscribe({
      next: () => {
        this.successMsg = 'Challenge sent!';
        this.showForm = false;
        this.form = this.emptyForm();
        this.loadAll();
        this.submitting = false;
      },
      error: (err) => {
        this.errorMsg = this.extractError(err);
        this.submitting = false;
      },
    });
  }

  respond(id: number, status: string): void {
    this.api.updateSparringStatus(id, status).subscribe({
      next: () => {
        this.successMsg = `Request ${status}.`;
        this.loadAll();
      },
      error: () => this.errorMsg = 'Failed to update request.',
    });
  }

  cancel(id: number): void {
    this.api.cancelSparringRequest(id).subscribe({
      next: () => {
        this.successMsg = 'Request cancelled.';
        this.loadAll();
      },
      error: () => this.errorMsg = 'Failed to cancel request.',
    });
  }

  private resolveExperienceMonths(user: User | null, martialArt: string): number | null {
    if (!user) {
      return null;
    }

    const target = martialArt.trim() || user.profile?.primary_martial_art || '';
    if (!target) {
      return null;
    }

    const experience = user.experiences.find(item =>
      item.martial_art.trim().toLowerCase() === target.trim().toLowerCase(),
    );

    return experience?.total_months ?? (experience ? (experience.years * 12) + experience.months : null);
  }

  private extractError(err: { error?: unknown }): string {
    const error = err.error;
    if (!error) {
      return 'Failed to send challenge.';
    }

    if (typeof error === 'string') {
      return error;
    }

    if (typeof error === 'object') {
      const flattened = Object.values(error as Record<string, unknown>).flat();
      const firstString = flattened.find(value => typeof value === 'string');
      if (typeof firstString === 'string') {
        return firstString;
      }
    }

    return 'Failed to send challenge.';
  }

  private emptyForm(): SparringRequestForm {
    return {
      opponent_id: 0,
      gym_id: 0,
      proposed_date: '',
      proposed_time: '',
      martial_art: '',
      duration: '',
      message: '',
      equipment_notes: '',
    };
  }
}
