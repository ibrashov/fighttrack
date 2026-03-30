import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Gym, GymForm,
  TrainingLog, TrainingLogForm, TrainingStats,
  SparringRequest, SparringRequestForm,
  User, UserProfileUpdate,
} from '../models/models';

const BASE = 'http://localhost:8000/api';

/**
 * Single Angular service using HttpClient for ALL API communication.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // ── Users ────────────────────────────────────────────────────────────────

  getProfile(): Observable<User> {
    return this.http.get<User>(`${BASE}/auth/profile/`);
  }

  updateProfile(data: UserProfileUpdate): Observable<User> {
    return this.http.put<User>(`${BASE}/auth/profile/`, data);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${BASE}/auth/users/`);
  }

  // ── Gyms ─────────────────────────────────────────────────────────────────

  getGyms(city?: string): Observable<Gym[]> {
    let params = new HttpParams();
    if (city) params = params.set('city', city);
    return this.http.get<Gym[]>(`${BASE}/gyms/`, { params });
  }

  getGym(id: number): Observable<Gym> {
    return this.http.get<Gym>(`${BASE}/gyms/${id}/`);
  }

  createGym(data: GymForm): Observable<Gym> {
    return this.http.post<Gym>(`${BASE}/gyms/create/`, data);
  }

  updateGym(id: number, data: Partial<GymForm>): Observable<Gym> {
    return this.http.put<Gym>(`${BASE}/gyms/${id}/edit/`, data);
  }

  deleteGym(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/gyms/${id}/edit/`);
  }

  // ── Training ─────────────────────────────────────────────────────────────

  getTrainingLogs(): Observable<TrainingLog[]> {
    return this.http.get<TrainingLog[]>(`${BASE}/training/`);
  }

  createTrainingLog(data: TrainingLogForm): Observable<TrainingLog> {
    return this.http.post<TrainingLog>(`${BASE}/training/`, data);
  }

  updateTrainingLog(id: number, data: Partial<TrainingLogForm>): Observable<TrainingLog> {
    return this.http.put<TrainingLog>(`${BASE}/training/${id}/`, data);
  }

  deleteTrainingLog(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/training/${id}/`);
  }

  getTrainingStats(): Observable<TrainingStats> {
    return this.http.get<TrainingStats>(`${BASE}/training/stats/`);
  }

  // ── Sparring ──────────────────────────────────────────────────────────────

  getSparringRequests(): Observable<SparringRequest[]> {
    return this.http.get<SparringRequest[]>(`${BASE}/sparring/`);
  }

  getIncomingSparring(): Observable<SparringRequest[]> {
    return this.http.get<SparringRequest[]>(`${BASE}/sparring/incoming/`);
  }

  createSparringRequest(data: SparringRequestForm): Observable<SparringRequest> {
    return this.http.post<SparringRequest>(`${BASE}/sparring/`, data);
  }

  updateSparringStatus(id: number, status: string): Observable<SparringRequest> {
    return this.http.patch<SparringRequest>(`${BASE}/sparring/${id}/status/`, { status });
  }

  cancelSparringRequest(id: number): Observable<SparringRequest> {
    return this.http.delete<SparringRequest>(`${BASE}/sparring/${id}/`);
  }
}
