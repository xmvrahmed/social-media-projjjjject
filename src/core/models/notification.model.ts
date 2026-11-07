import { User } from './user.model';

export interface AppNotification {
  _id: string;
  type?: string;
  message?: string;
  content?: string;
  actor?: User;
  user?: User;
  post?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  message: string;
  data: {
    notifications: AppNotification[];
  };
  meta?: {
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  };
}
