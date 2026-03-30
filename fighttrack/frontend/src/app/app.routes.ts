import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./components/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'training',
    loadComponent: () =>
      import('./components/training-log/training-log.component').then(m => m.TrainingLogComponent),
    canActivate: [authGuard],
  },
  {
    path: 'sparring',
    loadComponent: () =>
      import('./components/sparring/sparring.component').then(m => m.SparringComponent),
    canActivate: [authGuard],
  },
  {
    path: 'gyms',
    loadComponent: () =>
      import('./components/gyms/gyms.component').then(m => m.GymsComponent),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
