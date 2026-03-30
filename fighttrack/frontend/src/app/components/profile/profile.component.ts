import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  MARTIAL_ART_OPTIONS,
  SPARRING_DURATION_OPTIONS,
  User,
  UserExperience,
  UserProfileUpdate,
} from '../../models/models';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Fighter Profile</h1>
          <p class="subtitle">Manage your experience, achievements and sparring preferences.</p>
        </div>
      </header>

      @if (errorMsg) {
        <div class="alert alert-error">{{ errorMsg }}</div>
      }

      @if (successMsg) {
        <div class="alert alert-success">{{ successMsg }}</div>
      }

      @if (user) {
        <section class="profile-hero card">
          <div class="avatar">{{ initials() }}</div>
          <div class="hero-copy">
            <div class="eyebrow">FightTrack Member</div>
            <h2>{{ user.username }}</h2>
            <div class="hero-stats">
              <div class="hero-stat">
                <span class="label">Rating</span>
                <strong>{{ user.profile?.rating ?? 0 }}</strong>
              </div>
              <div class="hero-stat">
                <span class="label">Main Martial Art</span>
                <strong>{{ user.profile?.primary_martial_art || 'Not set' }}</strong>
              </div>
              <div class="hero-stat">
                <span class="label">Experience</span>
                <strong>{{ primaryExperienceLabel() }}</strong>
              </div>
              <div class="hero-stat">
                <span class="label">Achievements</span>
                <strong>{{ user.profile?.achievements_count ?? 0 }}</strong>
              </div>
            </div>
            <div class="tag-list">
              @for (sport of sportTags(); track sport) {
                <span class="tag">{{ sport }}</span>
              } @empty {
                <span class="tag muted">No martial arts added yet</span>
              }
            </div>
          </div>
        </section>

        <form class="profile-grid" [formGroup]="profileForm" (ngSubmit)="saveProfile()">
          <section class="card">
            <h3>Profile Basics</h3>
            <div class="grid two-col">
              <div class="form-group">
                <label>Username</label>
                <input [value]="user.username" readonly />
              </div>
              <div class="form-group">
                <label>Rating</label>
                <input type="number" min="0" formControlName="rating" />
              </div>
              <div class="form-group">
                <label>Main Martial Art</label>
                <input type="text" list="martial-art-options" formControlName="primary_martial_art" placeholder="Boxing" />
              </div>
              <div class="form-group">
                <label>Preferred Sparring Duration</label>
                <input type="text" list="duration-options" formControlName="preferred_sparring_duration" placeholder="3 rounds x 2 min" />
              </div>
            </div>

            <div class="form-group">
              <label>Achievements</label>
              <textarea
                formControlName="achievementsText"
                rows="4"
                placeholder="One achievement per line&#10;Tournament winner&#10;District champion&#10;Amateur 5 wins"
              ></textarea>
              <div class="hint">Add one achievement per line. We will save them as separate badges.</div>
            </div>

            <div class="form-group">
              <label>Equipment Notes / Gear Preferences</label>
              <textarea
                formControlName="equipment_notes"
                rows="3"
                placeholder="Bring 16 oz gloves. Headgear required."
              ></textarea>
            </div>

            <div class="form-group">
              <label>Bio</label>
              <textarea
                formControlName="bio"
                rows="3"
                placeholder="Style, training goals, preferred pace."
              ></textarea>
            </div>
          </section>

          <section class="card">
            <div class="section-head">
              <div>
                <h3>Experience</h3>
                <p>Track one or more combat sports with precise years and months.</p>
              </div>
              <button type="button" class="btn-secondary" (click)="addExperience()">+ Add martial art</button>
            </div>

            <div class="experience-stack" formArrayName="experiences">
              @for (entry of experienceControls.controls; track $index) {
                <div class="experience-row" [formGroupName]="$index">
                  <div class="experience-grid">
                    <div class="form-group experience-main">
                      <label>Martial Art</label>
                      <input type="text" list="martial-art-options" formControlName="martial_art" placeholder="Muay Thai" />
                    </div>
                    <div class="form-group small experience-years">
                      <label>Years</label>
                      <input type="number" min="0" formControlName="years" />
                    </div>
                    <div class="form-group small experience-months">
                      <label>Months</label>
                      <input type="number" min="0" max="11" formControlName="months" />
                    </div>
                    <div class="form-group action-cell">
                      <label class="action-label">Action</label>
                      <button type="button" class="btn-ghost danger remove-btn" (click)="removeExperience($index)">Remove</button>
                    </div>
                  </div>
                  <div class="form-group experience-notes">
                    <label>Notes</label>
                    <textarea formControlName="notes" rows="2" placeholder="Competition level, style focus, pacing notes."></textarea>
                  </div>
                </div>
              } @empty {
                <div class="empty-panel">
                  <strong>No experience entries yet.</strong>
                  <p>Add your first martial art to unlock smarter sparring matching.</p>
                </div>
              }
            </div>

            @if (experienceError()) {
              <div class="inline-error">{{ experienceError() }}</div>
            }
          </section>

          <section class="card side-card">
            <h3>Preview</h3>
            <div class="preview-item">
              <span>Main style</span>
              <strong>{{ profileForm.get('primary_martial_art')?.value || 'Not set' }}</strong>
            </div>
            <div class="preview-item">
              <span>Preferred duration</span>
              <strong>{{ profileForm.get('preferred_sparring_duration')?.value || 'Not set' }}</strong>
            </div>
            <div class="preview-item">
              <span>Total martial arts</span>
              <strong>{{ experienceControls.length }}</strong>
            </div>
            <div class="preview-item">
              <span>Achievements</span>
              <strong>{{ parsedAchievements().length }}</strong>
            </div>
            <div class="preview-item">
              <span>Current primary experience</span>
              <strong>{{ formPrimaryExperienceLabel() }}</strong>
            </div>
          </section>

          <div class="actions">
            <button type="submit" class="btn-primary" [disabled]="saving || !canSubmit()">
              {{ saving ? 'Saving...' : 'Save Profile' }}
            </button>
          </div>
        </form>

        <datalist id="martial-art-options">
          @for (option of martialArtOptions; track option) {
            <option [value]="option"></option>
          }
        </datalist>

        <datalist id="duration-options">
          @for (option of durationOptions; track option) {
            <option [value]="option"></option>
          }
        </datalist>
      }
    </div>
  `,
  styles: [``],
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  saving = false;
  successMsg = '';
  errorMsg = '';
  martialArtOptions = [...MARTIAL_ART_OPTIONS];
  durationOptions = [...SPARRING_DURATION_OPTIONS];

  profileForm = this.fb.group({
    bio: [''],
    weight_class: [''],
    rating: [0, [Validators.required, Validators.min(0)]],
    primary_martial_art: [''],
    preferred_sparring_duration: [''],
    equipment_notes: [''],
    achievementsText: [''],
    experiences: this.fb.array([]),
  });

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  get experienceControls(): FormArray {
    return this.profileForm.get('experiences') as FormArray;
  }

  initials(): string {
    return (this.user?.username || 'FT').slice(0, 2).toUpperCase();
  }

  sportTags(): string[] {
    return this.user?.experiences.map(item => item.martial_art) ?? [];
  }

  primaryExperienceLabel(): string {
    if (!this.user) {
      return 'Not set';
    }

    const primary = this.user.profile?.primary_martial_art || '';
    return this.formatExperience(this.findExperience(this.user.experiences, primary));
  }

  formPrimaryExperienceLabel(): string {
    const primary = `${this.profileForm.get('primary_martial_art')?.value || ''}`.trim();
    const experience = this.experienceControls.controls.find(control =>
      `${control.get('martial_art')?.value || ''}`.trim().toLowerCase() === primary.toLowerCase(),
    );

    if (!experience) {
      return 'Not set';
    }

    return this.formatMonths(
      Number(experience.get('years')?.value || 0),
      Number(experience.get('months')?.value || 0),
    );
  }

  parsedAchievements(): string[] {
    return `${this.profileForm.get('achievementsText')?.value || ''}`
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean);
  }

  addExperience(entry?: UserExperience): void {
    this.experienceControls.push(this.fb.group({
      martial_art: [entry?.martial_art ?? '', Validators.required],
      years: [entry?.years ?? 0, [Validators.required, Validators.min(0)]],
      months: [entry?.months ?? 0, [Validators.required, Validators.min(0), Validators.max(11)]],
      notes: [entry?.notes ?? ''],
    }));
  }

  removeExperience(index: number): void {
    this.experienceControls.removeAt(index);
  }

  experienceError(): string {
    const rows = this.experienceControls.controls;
    const names = rows
      .map(control => `${control.get('martial_art')?.value || ''}`.trim().toLowerCase())
      .filter(Boolean);

    if (names.length !== new Set(names).size) {
      return 'Each martial art should appear only once.';
    }

    for (const control of rows) {
      const years = Number(control.get('years')?.value || 0);
      const months = Number(control.get('months')?.value || 0);
      const martialArt = `${control.get('martial_art')?.value || ''}`.trim();

      if ((years > 0 || months > 0) && !martialArt) {
        return 'Choose a martial art for every experience row.';
      }

      if (martialArt && years === 0 && months === 0) {
        return 'Each experience row should be at least 1 month.';
      }
    }

    const primary = `${this.profileForm.get('primary_martial_art')?.value || ''}`.trim().toLowerCase();
    if (primary && !names.includes(primary)) {
      return 'Primary martial art should match one of your experience entries.';
    }

    return '';
  }

  canSubmit(): boolean {
    return this.profileForm.valid && !this.experienceError();
  }

  saveProfile(): void {
    if (!this.canSubmit()) {
      this.errorMsg = this.experienceError() || 'Please fix the highlighted profile fields.';
      return;
    }

    this.errorMsg = '';
    this.successMsg = '';
    this.saving = true;

    const payload: UserProfileUpdate = {
      bio: `${this.profileForm.get('bio')?.value || ''}`.trim(),
      weight_class: `${this.profileForm.get('weight_class')?.value || ''}`.trim(),
      rating: Number(this.profileForm.get('rating')?.value || 0),
      achievements: this.parsedAchievements(),
      primary_martial_art: `${this.profileForm.get('primary_martial_art')?.value || ''}`.trim(),
      preferred_sparring_duration: `${this.profileForm.get('preferred_sparring_duration')?.value || ''}`.trim(),
      equipment_notes: `${this.profileForm.get('equipment_notes')?.value || ''}`.trim(),
      experiences: this.experienceControls.controls.map(control => ({
        martial_art: `${control.get('martial_art')?.value || ''}`.trim(),
        years: Number(control.get('years')?.value || 0),
        months: Number(control.get('months')?.value || 0),
        notes: `${control.get('notes')?.value || ''}`.trim(),
      })),
    };

    this.api.updateProfile(payload).subscribe({
      next: (user) => {
        this.user = user;
        this.auth.updateCurrentUser(user);
        this.patchForm(user);
        this.successMsg = 'Profile saved successfully.';
        this.saving = false;
      },
      error: (err) => {
        this.errorMsg = this.extractError(err);
        this.saving = false;
      },
    });
  }

  private loadProfile(): void {
    this.api.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.auth.updateCurrentUser(user);
        this.patchForm(user);
      },
      error: () => {
        this.errorMsg = 'Failed to load your profile.';
      },
    });
  }

  private patchForm(user: User): void {
    const achievements = user.profile?.achievements?.join('\n') ?? '';
    this.profileForm.patchValue({
      bio: user.profile?.bio ?? '',
      weight_class: user.profile?.weight_class ?? '',
      rating: user.profile?.rating ?? 0,
      primary_martial_art: user.profile?.primary_martial_art ?? '',
      preferred_sparring_duration: user.profile?.preferred_sparring_duration ?? '',
      equipment_notes: user.profile?.equipment_notes ?? '',
      achievementsText: achievements,
    });

    this.experienceControls.clear();
    for (const experience of user.experiences) {
      this.addExperience(experience);
    }
  }

  private findExperience(experiences: UserExperience[], martialArt: string): UserExperience | undefined {
    const normalized = martialArt.trim().toLowerCase();
    return experiences.find(item => item.martial_art.trim().toLowerCase() === normalized) ?? experiences[0];
  }

  private formatExperience(experience?: UserExperience): string {
    if (!experience) {
      return 'Not set';
    }

    return this.formatMonths(experience.years, experience.months);
  }

  private formatMonths(years: number, months: number): string {
    const chunks: string[] = [];
    if (years) {
      chunks.push(`${years} year${years === 1 ? '' : 's'}`);
    }
    if (months) {
      chunks.push(`${months} month${months === 1 ? '' : 's'}`);
    }
    return chunks.join(' ') || '0 months';
  }

  private extractError(err: { error?: unknown }): string {
    if (!err.error) {
      return 'Failed to save profile.';
    }

    if (typeof err.error === 'string') {
      return err.error;
    }

    if (typeof err.error === 'object') {
      const values = Object.values(err.error as Record<string, unknown>).flat();
      const text = values.find(value => typeof value === 'string') as string | undefined;
      if (text) {
        return text;
      }
    }

    return 'Failed to save profile.';
  }
}
