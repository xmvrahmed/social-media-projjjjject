import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  isMenuOpen = signal(false);

  ngOnInit(): void {
    this.notificationService.getUnreadCount().subscribe({
      error: (error: unknown) => console.error('Could not load the unread notification count.', error)
    });
  }

  logout(): void {
    this.closeMenu();
    this.authService.logout();
  }

  toggleMenu(): void {
    this.isMenuOpen.update(open => !open);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }
}
