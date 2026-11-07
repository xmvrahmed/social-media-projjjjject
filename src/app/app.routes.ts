import { Routes } from '@angular/router';
import { AuthComponent } from '../layout/auth/auth.component';
import { MainComponent } from '../layout/main/main.component';
import { authGuard, guestGuard } from '../core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'feed', pathMatch: 'full' },
  {
    path: 'auth',
    component: AuthComponent,
    canActivate: [guestGuard],
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', loadComponent: () => import('../core/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('../core/auth/register/register.component').then(m => m.RegisterComponent) },
      { path: 'forget', loadComponent: () => import('../core/auth/forgetpassword/forgetpassword.component').then(m => m.ForgetpasswordComponent) }
    ]
  },
  {
    path: '',
    component: MainComponent,
    canActivate: [authGuard],
    children: [
      { path: 'feed', loadComponent: () => import('../features/feed/feed.component').then(m => m.FeedComponent) },
      { path: 'profile', loadComponent: () => import('../features/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'profile/:userId', loadComponent: () => import('../features/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'posts/:postId', loadComponent: () => import('../features/post-detail/post-detail.component').then(m => m.PostDetailComponent) },
      { path: 'change-password', loadComponent: () => import('../features/change-password/change-password.component').then(m => m.ChangePasswordComponent) },
      { path: 'notifications', loadComponent: () => import('../features/notification/notification.component').then(m => m.NotificationComponent) }
    ]
  },
  { path: '**', loadComponent: () => import('../features/notfound/notfound.component').then(m => m.NotfoundComponent) }
];
