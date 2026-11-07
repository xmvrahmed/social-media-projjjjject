import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PostComment, CommentReply } from '../../../core/models/comment.model';
import { CommentService } from '../../../core/services/comment.service';
import { AuthService } from '../../../core/services/auth.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-comment-section',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TimeAgoPipe],
  templateUrl: './comment-section.component.html'
})
export class CommentSectionComponent implements OnInit {
  @Input({ required: true }) postId!: string;

  commentService = inject(CommentService);
  authService = inject(AuthService);

  comments = signal<PostComment[]>([]);
  isLoading = signal(false);
  isLoadingMore = signal(false);
  hasMore = signal(false);
  nextPage = signal<number | null>(null);
  errorMessage = signal<string | null>(null);

  newCommentText = signal('');
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  isSubmitting = signal(false);

  editingCommentId = signal<string | null>(null);
  editContent = signal('');
  actionError = signal<string | null>(null);

  activeReplyCommentId = signal<string | null>(null);
  replyText = signal('');
  repliesMap = signal<Record<string, CommentReply[]>>({});
  loadingRepliesMap = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    this.loadComments();
  }

  loadComments(page = 1, append = false): void {
    if (append) this.isLoadingMore.set(true);
    else this.isLoading.set(true);
    this.errorMessage.set(null);

    this.commentService.getComments(this.postId, page).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
        const newComments: PostComment[] = res.data?.comments || [];
        this.comments.update(current => append ? [...current, ...newComments] : newComments);
        const nextPage = res.meta?.pagination?.nextPage ?? null;
        this.nextPage.set(nextPage);
        this.hasMore.set(!!nextPage && newComments.length > 0);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
        this.errorMessage.set(error.error?.message || 'Could not load comments. Please try again.');
      }
    });
  }

  loadMore(): void {
    const page = this.nextPage();
    if (this.isLoadingMore() || !this.hasMore() || !page) return;
    this.loadComments(page, true);
  }

  isCommentOwner(comment: PostComment): boolean {
    const currentId = this.authService.currentUser()?._id;
    return !!(currentId && comment.commentCreator?._id && currentId === comment.commentCreator._id);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedFile.set(file);

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
  }

  submitComment(): void {
    const text = this.newCommentText().trim();
    const file = this.selectedFile();

    if (!text && !file) return;

    this.isSubmitting.set(true);
    this.actionError.set(null);
    this.commentService.createComment(this.postId, text, file).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.newCommentText.set('');
        this.removeFile();
        if (res.data?.comment) {
          this.comments.update(list => [res.data.comment, ...list]);
        } else {
          this.loadComments();
        }
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.actionError.set(error.error?.message || 'Could not add your comment. Please try again.');
      }
    });
  }

  startEditComment(comment: PostComment): void {
    this.editingCommentId.set(comment._id);
    this.editContent.set(comment.content || '');
  }

  cancelEdit(): void {
    this.editingCommentId.set(null);
  }

  saveEditComment(comment: PostComment): void {
    const text = this.editContent().trim();
    if (!text) return;

    this.actionError.set(null);
    this.commentService.updateComment(this.postId, comment._id, text).subscribe({
      next: () => {
        comment.content = text;
        this.editingCommentId.set(null);
      },
      error: (error) => this.actionError.set(error.error?.message || 'Could not update your comment.')
    });
  }

  deleteComment(commentId: string): void {
    if (!confirm('Are you sure you want to remove this comment?')) return;

    this.commentService.deleteComment(this.postId, commentId).subscribe({
      next: () => {
        this.comments.update(list => list.filter(c => c._id !== commentId));
      },
      error: (error) => this.actionError.set(error.error?.message || 'Could not delete your comment.')
    });
  }

  likeComment(comment: PostComment): void {
    const prevLiked = comment.isLiked;
    const prevCount = comment.likesCount ?? 0;
    comment.isLiked = !prevLiked;
    comment.likesCount = comment.isLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    this.commentService.likeComment(this.postId, comment._id).subscribe({
      error: () => {
        comment.isLiked = prevLiked;
        comment.likesCount = prevCount;
        this.actionError.set('Could not update the comment reaction. Please try again.');
      }
    });
  }

  toggleReplies(commentId: string): void {
    const currentReplies = this.repliesMap()[commentId];
    if (currentReplies) {
      const nextMap = { ...this.repliesMap() };
      delete nextMap[commentId];
      this.repliesMap.set(nextMap);
      return;
    }

    this.loadingRepliesMap.update(m => ({ ...m, [commentId]: true }));
    this.commentService.getReplies(this.postId, commentId).subscribe({
      next: (res) => {
        this.loadingRepliesMap.update(m => ({ ...m, [commentId]: false }));
        this.repliesMap.update(m => ({ ...m, [commentId]: res.data?.replies || [] }));
      },
      error: () => {
        this.loadingRepliesMap.update(m => ({ ...m, [commentId]: false }));
        this.actionError.set('Could not load replies. Please try again.');
      }
    });
  }

  openReplyInput(commentId: string): void {
    if (this.activeReplyCommentId() === commentId) {
      this.activeReplyCommentId.set(null);
    } else {
      this.activeReplyCommentId.set(commentId);
      this.replyText.set('');
    }
  }

  sendReply(commentId: string): void {
    const text = this.replyText().trim();
    if (!text) return;

    this.actionError.set(null);
    this.commentService.createReply(this.postId, commentId, text).subscribe({
      next: (res) => {
        this.replyText.set('');
        this.activeReplyCommentId.set(null);
        if (res.data?.reply) {
          const list = this.repliesMap()[commentId] || [];
          this.repliesMap.update(m => ({ ...m, [commentId]: [...list, res.data.reply] }));
        } else {
          this.toggleReplies(commentId);
        }
      },
      error: (error) => this.actionError.set(error.error?.message || 'Could not add your reply.')
    });
  }
}
