import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Post } from '../../core/models/post.model';
import { PostService } from '../../core/services/post.service';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';
import { CommentSectionComponent } from '../../shared/components/comment-section/comment-section.component';

@Component({
  selector: 'app-post-detail',
  imports: [RouterLink, PostCardComponent, CommentSectionComponent],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.css',
})
export class PostDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private postService = inject(PostService);

  post = signal<Post | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const postId = params.get('postId');
      if (postId) this.loadPost(postId);
    });
  }

  private loadPost(postId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.postService.getPostById(postId).subscribe({
      next: response => {
        this.post.set(response.data?.post ?? null);
        this.isLoading.set(false);
        if (!response.data?.post) this.errorMessage.set('This post could not be found.');
      },
      error: error => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Could not load this post. Please try again.');
      }
    });
  }
}
