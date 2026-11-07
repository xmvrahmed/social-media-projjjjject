import { Component, OnInit, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { User } from '../../core/models/user.model';
import { Post } from '../../core/models/post.model';
import { AuthService } from '../../core/services/auth.service';
import { PostService } from '../../core/services/post.service';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, PostCardComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  @Input() userId?: string;

  private route = inject(ActivatedRoute);
  authService = inject(AuthService);
  private postService = inject(PostService);

  user = signal<User | null>(null);
  posts = signal<Post[]>([]);
  bookmarks = signal<Post[]>([]);
  activeTab = signal<'posts' | 'saved'>('posts');
  isLoading = signal(true);
  isUploadingPhoto = signal(false);
  isLoadingBookmarks = signal(false);
  bookmarksLoaded = signal(false);
  isFollowing = signal(false);
  errorMessage = signal<string | null>(null);

  get isOwnProfile(): boolean {
    const current = this.authService.currentUser();
    const target = this.user();
    if (!target) return true;
    return !!(current && target && current._id === target._id);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = this.userId || params.get('userId');
      if (id && id !== this.authService.currentUser()?._id) {
        this.loadOtherUserProfile(id);
      } else {
        this.loadCurrentUserProfile();
      }
    });
  }

  loadCurrentUserProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.bookmarks.set([]);
    this.bookmarksLoaded.set(false);
    const currentUser = this.authService.currentUser();
    this.user.set(currentUser);

    this.loadBookmarks();

    this.postService.getFeed('me', 1, 50).subscribe({
      next: (res) => {
        this.posts.set(res.data?.posts || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Could not load profile posts. Please try again.');
      }
    });

    this.authService.getProfileData().subscribe({
      next: (res) => {
        if (res.data?.user) {
          this.user.set(res.data.user);
        }
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Could not refresh your profile information.');
      }
    });
  }

  loadOtherUserProfile(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.authService.getUserProfile(id).subscribe({
      next: (res) => {
        this.user.set(res.data?.user || null);
        this.isFollowing.set(!!res.data?.isFollowing);
        this.authService.getUserPosts(id).subscribe({
          next: (postRes) => {
            this.posts.set(postRes.data?.posts || []);
            this.isLoading.set(false);
          },
          error: (error) => {
            this.isLoading.set(false);
            this.errorMessage.set(error.error?.message || 'Could not load this user’s posts.');
          }
        });
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Could not load this profile.');
      }
    });
  }

  setTab(tab: 'posts' | 'saved'): void {
    this.activeTab.set(tab);
    if (tab === 'saved' && !this.bookmarksLoaded()) {
      this.loadBookmarks();
    }
  }

  private loadBookmarks(): void {
    if (this.isLoadingBookmarks() || this.bookmarksLoaded()) return;

    this.isLoadingBookmarks.set(true);
    this.authService.getBookmarks().subscribe({
      next: (res) => {
        this.bookmarks.set(res.data?.bookmarks || []);
        this.bookmarksLoaded.set(true);
        this.isLoadingBookmarks.set(false);
      },
      error: (error) => {
        this.isLoadingBookmarks.set(false);
        this.errorMessage.set(error.error?.message || 'Could not load saved posts.');
      }
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.isUploadingPhoto.set(true);

      this.authService.uploadProfilePhoto(file).subscribe({
        next: (res) => {
          this.isUploadingPhoto.set(false);
          if (res.data?.user) {
            this.user.set(res.data.user);
          }
        },
        error: (error) => {
          this.isUploadingPhoto.set(false);
          this.errorMessage.set(error.error?.message || 'Could not upload your profile photo.');
        }
      });
    }
  }

  toggleFollow(): void {
    const target = this.user();
    if (!target) return;

    const prev = this.isFollowing();
    this.isFollowing.set(!prev);

    this.authService.toggleFollowUser(target._id).subscribe({
      error: () => {
        this.isFollowing.set(prev);
        this.errorMessage.set('Could not update follow status. Please try again.');
      }
    });
  }

  onPostDeleted(postId: string): void {
    this.posts.update(list => list.filter(p => p._id !== postId));
  }

  onPostUpdated(updated: Post): void {
    this.posts.update(list => list.map(p => p._id === updated._id ? updated : p));
  }
}
