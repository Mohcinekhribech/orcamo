import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SiteHeaderComponent } from '../shared/components/site-header.component';
import { SiteFooterComponent } from '../shared/components/site-footer.component';
import { AnalyticsService } from '../shared/services/analytics.service';

interface BlogAuthor {
  name: string;
  role: string;
  avatar: string;
}

interface BlogArticle {
  id: string;
  slug?: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  image: string;
  imageAlt: string;
  author?: BlogAuthor;
}

interface BlogHero {
  badge: string;
  title: string;
  description: string;
  backgroundImage: string;
  backgroundImageAlt: string;
}

interface BlogNewsletter {
  title: string;
  description: string;
  placeholder: string;
  buttonText: string;
  disclaimer: string;
}

interface BlogData {
  categories: string[];
  featuredArticle: BlogArticle;
  articles: BlogArticle[];
  hero: BlogHero;
  newsletter: BlogNewsletter;
}

interface BlogArticleWithSlug extends BlogArticle {
  slug?: string;
}

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SiteHeaderComponent,
    SiteFooterComponent
  ],
  templateUrl: './blog.component.html'
})
export class BlogComponent implements OnInit {
  searchQuery = '';
  blogData: BlogData | null = null;
  loading = true;

  featuredArticle: BlogArticle | null = null;
  articles: BlogArticle[] = [];
  hero: BlogHero | null = null;
  newsletter: BlogNewsletter | null = null;

  constructor(
    private http: HttpClient,
    private analytics: AnalyticsService
  ) {}

  ngOnInit(): void {
    // Add scroll event listener for header styling
    window.addEventListener('scroll', this.handleScroll.bind(this));
    
    // Load blog data from JSON file
    this.loadBlogData();
  }

  loadBlogData(): void {
    this.http.get<BlogData>('assets/data/blog-data.json').subscribe({
      next: (data) => {
        this.blogData = data;
        this.featuredArticle = data.featuredArticle;
        this.articles = data.articles;
        this.hero = data.hero;
        this.newsletter = data.newsletter;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading blog data:', error);
        this.loading = false;
      }
    });
  }

  get filteredArticles(): BlogArticle[] {
    if (!this.articles) return [];
    
    // If no search query, return all articles
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      return this.articles;
    }
    
    // Search in title, description, and category (case-insensitive)
    const query = this.searchQuery.toLowerCase().trim();
    return this.articles.filter(article => 
      article.title.toLowerCase().includes(query) ||
      article.description.toLowerCase().includes(query) ||
      article.category.toLowerCase().includes(query)
    );
  }

  handleScroll(): void {
    const header = document.querySelector('header');
    if (header) {
      if (window.scrollY > 50) {
        header.classList.add('bg-white/98', 'shadow-sm');
      } else {
        header.classList.remove('bg-white/98', 'shadow-sm');
      }
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  trackArticleClick(articleTitle: string, articleSlug?: string): void {
    this.analytics.trackEvent('article_click', {
      event_category: 'content',
      event_label: articleTitle,
      article_slug: articleSlug || ''
    });
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

