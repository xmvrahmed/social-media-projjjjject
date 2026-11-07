import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Post } from '../../core/models/post.model';
import { User } from '../../core/models/user.model';
import { PostService } from '../../core/services/post.service';
import { AuthService } from '../../core/services/auth.service';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';
import { CreatePostComponent } from '../../shared/components/create-post/create-post.component';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PostCardComponent, CreatePostComponent],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css'
})
export class FeedComponent implements OnInit {
  private postService = inject(PostService);
  authService = inject(AuthService);

  posts = signal<Post[]>([]);
  suggestedUsers = signal<User[]>([]);
  private suggestionPool = signal<User[]>([]);
  private suggestionOffset = signal(0);
  searchQuery = signal('');
  isLoading = signal(true);
  isLoadingMore = signal(false);
  isLoadingSuggestions = signal(false);
  hasMore = signal(true);
  currentPage = signal(1);
  activeNav = signal<'feed' | 'my-posts' | 'community' | 'saved'>('feed');
  errorMessage = signal<string | null>(null);
  suggestionError = signal<string | null>(null);

  private readonly suggestionsPerPage = 6;

  filteredSuggestions = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.suggestedUsers();
    return this.suggestedUsers().filter(u =>
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

  ngOnInit(): void {
    this.loadPosts(1, false);
    this.loadSuggestions();
  }

  loadSuggestions(refresh = false): void {
    if (this.isLoadingSuggestions()) return;

    this.isLoadingSuggestions.set(true);
    this.suggestionError.set(null);
    this.authService.getSuggestions(30).subscribe({
      next: (res) => {
        const users: User[] = res.data?.suggestions || res.data?.users || [];
        const offset = refresh && users.length > this.suggestionsPerPage
          ? (this.suggestionOffset() + this.suggestionsPerPage) % users.length
          : 0;

        this.suggestionPool.set(users);
        this.suggestionOffset.set(offset);
        this.suggestedUsers.set(this.getSuggestionPage(users, offset));
        this.isLoadingSuggestions.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.isLoadingSuggestions.set(false);
        this.suggestionError.set(error.error?.message || 'Could not load suggestions. Please try again.');
      }
    });
  }

  private getSuggestionPage(users: User[], offset: number): User[] {
    if (!users.length) return [];
    const count = Math.min(this.suggestionsPerPage, users.length);
    return Array.from({ length: count }, (_, index) => users[(offset + index) % users.length]);
  }

  setNav(nav: 'feed' | 'my-posts' | 'community' | 'saved'): void {
    this.activeNav.set(nav);
    this.currentPage.set(1);
    this.loadPosts(1, false);
  }

  loadPosts(page: number, append: boolean = false): void {
    if (append) {
      this.isLoadingMore.set(true);
    } else {
      this.isLoading.set(true);
    }
    this.errorMessage.set(null);

    const nav = this.activeNav();
    let request$;

    if (nav === 'saved') {
      request$ = this.authService.getBookmarks();
    } else if (nav === 'my-posts') {
      request$ = this.postService.getFeed('me', page, 15);
    } else if (nav === 'community') {
      request$ = this.postService.getFeed('', page, 15);
    } else {
      request$ = this.postService.getFeed('', page, 15);
    }

    request$.subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.isLoadingMore.set(false);

        const newPosts: Post[] = res.data?.posts || res.data?.bookmarks || [];
        if (append) {
          this.posts.update(current => [...current, ...newPosts]);
        } else {
          this.posts.set(newPosts);
        }

        const next = res.meta?.pagination?.nextPage;
        this.hasMore.set(!!next && newPosts.length > 0);
      },
      error: () => {
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
        this.errorMessage.set('Could not load posts right now. Please try again.');
      }
    });
  }

  loadMore(): void {
    if (this.isLoadingMore() || !this.hasMore()) return;
    const nextPage = this.currentPage() + 1;
    this.currentPage.set(nextPage);
    this.loadPosts(nextPage, true);
  }

  followUser(user: User): void {
    this.authService.toggleFollowUser(user._id).subscribe({
      next: () => {
        const users = this.suggestionPool().filter(candidate => candidate._id !== user._id);
        const offset = users.length ? this.suggestionOffset() % users.length : 0;
        this.suggestionPool.set(users);
        this.suggestionOffset.set(offset);
        this.suggestedUsers.set(this.getSuggestionPage(users, offset));
      }
    });
  }

  onPostCreated(): void {
    this.currentPage.set(1);
    this.loadPosts(1, false);
  }

  onPostDeleted(postId: string): void {
    this.posts.update(list => list.filter(p => p._id !== postId));
  }

  onPostUpdated(updated: Post): void {
    this.posts.update(list => list.map(p => p._id === updated._id ? updated : p));
  }
}
