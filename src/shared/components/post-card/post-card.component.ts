import { Component, Input, Output, EventEmitter, inject, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Post } from '../../../core/models/post.model';
import { PostService } from '../../../core/services/post.service';
import { AuthService } from '../../../core/services/auth.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TimeAgoPipe],
  templateUrl: './post-card.component.html'
})
export class PostCardComponent {
  @Input({ required: true }) post!: Post;
  @Input() isDetailView = false;

  @Output() postDeleted = new EventEmitter<string>();
  @Output() postUpdated = new EventEmitter<Post>();

  authService = inject(AuthService);
  private postService = inject(PostService);
  private router = inject(Router);
  private el = inject(ElementRef);

  menuOpen = signal(false);
  isEditing = signal(false);
  editContent = signal('');
  isUpdating = signal(false);
  isLiking = signal(false);
  isDeleting = signal(false);
  showDeleteModal = signal(false);
  showImageModal = signal(false);
  errorMessage = signal<string | null>(null);

  get isOwner(): boolean {
    const currentId = this.authService.currentUser()?._id;
    return !!(currentId && this.post.user?._id && currentId === this.post.user._id);
  }

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }

  onLike(): void {
    if (this.isLiking()) return;

    const prevLiked = this.post.isLiked;
    const prevCount = this.post.likesCount ?? 0;

    this.isLiking.set(true);
    this.post.isLiked = !prevLiked;
    this.post.likesCount = this.post.isLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    this.postService.likePost(this.post._id).subscribe({
      next: (res) => {
        if (res.data?.post) {
          if (typeof res.data.post.likesCount === 'number') {
            this.post.likesCount = res.data.post.likesCount;
          }
          if (typeof res.data.post.isLiked === 'boolean') {
            this.post.isLiked = res.data.post.isLiked;
          }
        }
        this.isLiking.set(false);
      },
      error: () => {
        this.post.isLiked = prevLiked;
        this.post.likesCount = prevCount;
        this.isLiking.set(false);
        this.errorMessage.set('Could not update the post reaction. Please try again.');
      }
    });
  }

  onBookmark(): void {
    this.post.isBookmarked = !this.post.isBookmarked;
    this.postService.bookmarkPost(this.post._id).subscribe({
      error: () => {
        this.post.isBookmarked = !this.post.isBookmarked;
        this.errorMessage.set('Could not update saved posts. Please try again.');
      }
    });
  }

  onShare(): void {
    this.postService.sharePost(this.post._id).subscribe({
      next: () => {
        this.post.sharesCount = (this.post.sharesCount ?? 0) + 1;
      },
      error: () => this.errorMessage.set('Could not share this post. Please try again.')
    });
  }

  startEdit(): void {
    this.editContent.set(this.post.body || '');
    this.isEditing.set(true);
    this.closeMenu();
  }

  cancelEdit(): void {
    this.isEditing.set(false);
  }

  saveEdit(): void {
    const newBody = this.editContent().trim();
    if (!newBody) return;

    this.isUpdating.set(true);
    this.postService.updatePost(this.post._id, newBody).subscribe({
      next: (res) => {
        this.isUpdating.set(false);
        this.isEditing.set(false);
        if (res.data?.post) {
          this.post = res.data.post;
        } else {
          this.post.body = newBody;
        }
        this.postUpdated.emit(this.post);
      },
      error: () => {
        this.isUpdating.set(false);
        this.errorMessage.set('Could not update this post. Please try again.');
      }
    });
  }

  openDeleteModal(): void {
    this.closeMenu();
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    this.isDeleting.set(true);
    this.postService.deletePost(this.post._id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.showDeleteModal.set(false);
        this.postDeleted.emit(this.post._id);
        if (this.isDetailView) {
          this.router.navigate(['/feed']);
        }
      },
      error: () => {
        this.isDeleting.set(false);
        this.errorMessage.set('Could not delete this post. Please try again.');
      }
    });
  }
}
