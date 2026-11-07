import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getComments(postId: string, page: number = 1, limit: number = 20): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/posts/${postId}/comments?page=${page}&limit=${limit}`);
  }

  createComment(postId: string, content: string, image?: File | null): Observable<any> {
    const formData = new FormData();
    if (content) formData.append('content', content);
    if (image) formData.append('image', image);
    return this.http.post<any>(`${this.baseUrl}/posts/${postId}/comments`, formData);
  }

  updateComment(postId: string, commentId: string, content: string, image?: File | null): Observable<any> {
    const formData = new FormData();
    formData.append('content', content);
    if (image) formData.append('image', image);
    return this.http.put<any>(`${this.baseUrl}/posts/${postId}/comments/${commentId}`, formData);
  }

  deleteComment(postId: string, commentId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/posts/${postId}/comments/${commentId}`);
  }

  likeComment(postId: string, commentId: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/posts/${postId}/comments/${commentId}/like`, {});
  }

  getReplies(postId: string, commentId: string, page: number = 1, limit: number = 15): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/posts/${postId}/comments/${commentId}/replies?page=${page}&limit=${limit}`);
  }

  createReply(postId: string, commentId: string, content: string, image?: File | null): Observable<any> {
    const formData = new FormData();
    if (content) formData.append('content', content);
    if (image) formData.append('image', image);
    return this.http.post<any>(`${this.baseUrl}/posts/${postId}/comments/${commentId}/replies`, formData);
  }
}
