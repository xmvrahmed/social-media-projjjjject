import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { NotificationsResponse, AppNotification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  unreadCount = signal(0);
  notifications = signal<AppNotification[]>([]);

  getNotifications(page: number = 1, limit: number = 20, unread: boolean = false): Observable<NotificationsResponse> {
    return this.http.get<NotificationsResponse>(
      `${this.baseUrl}/notifications?unread=${unread}&page=${page}&limit=${limit}`
    ).pipe(
      tap(res => {
        if (res.data?.notifications) {
          this.notifications.set(res.data.notifications);
        }
      })
    );
  }

  getUnreadCount(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/notifications/unread-count`).pipe(
      tap(res => {
        const count = res.data?.unreadCount ?? res.data?.count ?? 0;
        this.unreadCount.set(count);
      })
    );
  }

  markAsRead(notificationId: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/notifications/${notificationId}/read`, {}).pipe(
      tap(() => {
        this.unreadCount.update(c => Math.max(0, c - 1));
        this.notifications.update(list =>
          list.map(n => n._id === notificationId ? { ...n, isRead: true, read: true } : n)
        );
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/notifications/read-all`, {}).pipe(
      tap(() => {
        this.unreadCount.set(0);
        this.notifications.update(list =>
          list.map(n => ({ ...n, isRead: true, read: true }))
        );
      })
    );
  }
}
