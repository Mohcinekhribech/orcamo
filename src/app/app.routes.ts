import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { BlogComponent } from './blog/blog.component';
import { BlogPostComponent } from './blog-post/blog-post.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent
  },
  {
    path: 'blog',
    component: BlogComponent
  },
  {
    path: 'blog/:slug',
    component: BlogPostComponent
  }
]; 