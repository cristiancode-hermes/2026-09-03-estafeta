import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage), canActivate: [guestGuard] },
  { path: 'entrar', loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage), canActivate: [guestGuard] },
  { path: 'registro', loadComponent: () => import('./pages/register.page').then((m) => m.RegisterPage), canActivate: [guestGuard] },
  {
    path: '',
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', loadComponent: () => import('./pages/home.page').then((m) => m.HomePage) },
      { path: 'rutas', loadComponent: () => import('./pages/routes.page').then((m) => m.RoutesPage) },
      { path: 'rutas/:id', loadComponent: () => import('./pages/route-detail.page').then((m) => m.RouteDetailPage) },
      { path: 'salidas/:id', loadComponent: () => import('./pages/salida-detail.page').then((m) => m.SalidaDetailPage) },
      { path: 'checkout', loadComponent: () => import('./pages/checkout.page').then((m) => m.CheckoutPage), canActivate: [authGuard] },
      { path: 'confirmacion/:code', loadComponent: () => import('./pages/confirm.page').then((m) => m.ConfirmPage), canActivate: [authGuard] },
      { path: 'envio/:code', loadComponent: () => import('./pages/public-shipment.page').then((m) => m.PublicShipmentPage) },
      { path: 'mis-envios', loadComponent: () => import('./pages/my-shipments.page').then((m) => m.MyShipmentsPage), canActivate: [authGuard] },
      { path: 'mis-envios/:code', loadComponent: () => import('./pages/my-shipment-detail.page').then((m) => m.MyShipmentDetailPage), canActivate: [authGuard] },
      { path: 'llegadas', loadComponent: () => import('./pages/arrivals.page').then((m) => m.ArrivalsPage), canActivate: [authGuard] },
      { path: 'llegada/:code', loadComponent: () => import('./pages/public-arrival.page').then((m) => m.PublicArrivalPage) },
      { path: 'cuenta', loadComponent: () => import('./pages/account.page').then((m) => m.AccountPage), canActivate: [authGuard] },
      { path: 'staff', loadComponent: () => import('./pages/staff.page').then((m) => m.StaffPage), canActivate: [roleGuard(['staff', 'admin'])] },
      { path: 'staff/scan', loadComponent: () => import('./pages/staff-scan.page').then((m) => m.StaffScanPage), canActivate: [roleGuard(['staff', 'admin'])] },
      { path: 'admin', loadComponent: () => import('./pages/admin.page').then((m) => m.AdminPage), canActivate: [roleGuard(['admin'])] },
      { path: '**', loadComponent: () => import('./pages/not-found.page').then((m) => m.NotFoundPage) },
    ],
  },
];
