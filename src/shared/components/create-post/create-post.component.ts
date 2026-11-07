import { Component, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { PostService } from '../../../core/services/post.service';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-post.component.html'
})
export class CreatePostComponent {
  authService = inject(AuthService);
  private postService = inject(PostService);

  @Output() postCreated = new EventEmitter<void>();

  body = signal('');
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  get userDisplayName(): string {
    const user = this.authService.currentUser();
    return user?.name || user?.username || 'Social User';
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

  onContentKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) {
      return;
    }

    event.preventDefault();
    this.onSubmit();
  }

  onSubmit(): void {
    const content = this.body().trim();
    const file = this.selectedFile();

    if (this.isSubmitting() || (!content && !file)) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.postService.createPost(content, file).subscribe({
      next: () => {
        this.body.set('');
        this.selectedFile.set(null);
        this.previewUrl.set(null);
        this.isSubmitting.set(false);
        this.postCreated.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to publish post. Please try again.');
      }
    });
  }
}
