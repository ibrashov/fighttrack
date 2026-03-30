export const MARTIAL_ART_OPTIONS = [
  'Boxing',
  'MMA',
  'Muay Thai',
  'Kickboxing',
  'Wrestling',
  'BJJ',
  'Judo',
  'Karate',
  'Taekwondo',
  'Sambo',
  'Other',
] as const;

export const SPARRING_DURATION_OPTIONS = [
  '15 min',
  '30 min',
  '45 min',
  '3 rounds x 2 min',
  '3 rounds x 3 min',
  '5 rounds x 3 min',
] as const;

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UserExperience {
  id?: number;
  martial_art: string;
  years: number;
  months: number;
  notes: string;
  total_months?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  bio: string;
  weight_class: string;
  years_experience: number;
  rating: number;
  achievements: string[];
  achievements_count: number;
  primary_martial_art: string;
  preferred_sparring_duration: string;
  equipment_notes: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile: UserProfile | null;
  experiences: UserExperience[];
  latest_achievement: string;
  display_experience: string;
}

export interface UserProfileUpdate {
  bio: string;
  weight_class: string;
  rating: number;
  achievements: string[];
  primary_martial_art: string;
  preferred_sparring_duration: string;
  equipment_notes: string;
  experiences: UserExperience[];
}

export interface Gym {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface GymForm {
  name: string;
  address: string;
  city: string;
  country: string;
  description: string;
}

export type FocusType = 'striking' | 'grappling' | 'conditioning' | 'sparring' | 'technique';

export interface TrainingLog {
  id: number;
  user: number;
  username: string;
  title: string;
  focus: FocusType;
  focus_display: string;
  duration_minutes: number;
  intensity: number;
  intensity_display: string;
  notes: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingLogForm {
  title: string;
  focus: FocusType;
  duration_minutes: number;
  intensity: number;
  notes: string;
  date: string;
}

export interface TrainingStats {
  total_sessions: number;
  total_minutes: number;
  total_hours: number;
  focus_breakdown: Record<string, number>;
}

export type SparringStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface SparringRequest {
  id: number;
  initiator: number;
  initiator_username: string;
  opponent: number;
  opponent_username: string;
  gym: number;
  gym_detail: Gym;
  proposed_date: string;
  proposed_time: string;
  martial_art: string;
  duration: string;
  message: string;
  equipment_notes: string;
  status: SparringStatus;
  status_display: string;
  created_at: string;
  updated_at: string;
}

export interface SparringRequestForm {
  opponent_id: number;
  gym_id: number;
  proposed_date: string;
  proposed_time: string;
  martial_art: string;
  duration: string;
  message: string;
  equipment_notes: string;
}
