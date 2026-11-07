import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';
import { AppNotification } from '../../core/models/notification.model';

@Component({
  selector: 'app-notification',
  imports: [CommonModule, DatePipe],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css',
})
export class NotificationComponent implements OnInit {
  private notificationService = inject(NotificationService);

  notifications = this.notificationService.notifications;
  unreadCount = computed(() => Math.max(
    this.notificationService.unreadCount(),
    this.notifications().filter(notification => !notification.isRead && !notification.read).length
  ));
  isLoading = signal(true);
  isUpdating = signal(false);
  errorMessage = signal<string | null>(null);
  countError = signal<string | null>(null);
  actionError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.notificationService.getNotifications().subscribe({
      next: () => {
        this.isLoading.set(false);
        this.loadUnreadCount();
      },
      error: (error: { error?: { message?: string } }) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Could not load notifications. Please try again.');
      }
    });
  }

  markAsRead(notification: AppNotification): void {
    if (notification.isRead || notification.read || this.isUpdating()) return;

    this.actionError.set(null);
    this.isUpdating.set(true);
    this.notificationService.markAsRead(notification._id).subscribe({
      next: () => this.isUpdating.set(false),
      error: (error: { error?: { message?: string } }) => {
        this.isUpdating.set(false);
        this.actionError.set(error.error?.message || 'Could not mark this notification as read.');
      }
    });
  }

  markAllAsRead(): void {
    if (!this.unreadCount() || this.isUpdating()) return;

    this.actionError.set(null);
    this.isUpdating.set(true);
    this.notificationService.markAllAsRead().subscribe({
      next: () => this.isUpdating.set(false),
      error: (error: { error?: { message?: string } }) => {
        this.isUpdating.set(false);
        this.actionError.set(error.error?.message || 'Could not mark notifications as read.');
      }
    });
  }

  loadUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: () => this.countError.set(null),
      error: (error: { error?: { message?: string } }) => {
        this.countError.set(error.error?.message || 'Could not load the unread notification count.');
      }
    });
  }
}
