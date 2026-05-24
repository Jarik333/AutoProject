import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'clients', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
  {
    path: 'clients',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/clients/clients.component').then(m => m.ClientsComponent)
  },
  {
    path: 'work-orders',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/work-orders/work-orders.component').then(m => m.WorkOrdersComponent)
  },
  { path: '**', redirectTo: 'clients' }
];
