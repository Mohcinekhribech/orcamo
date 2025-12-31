import { Component, OnInit, AfterViewInit, ChangeDetectorRef, Inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Title, Meta } from '@angular/platform-browser';
import { SiteHeaderComponent } from '../shared/components/site-header.component';
import { SiteFooterComponent } from '../shared/components/site-footer.component';
import { AnalyticsService } from '../shared/services/analytics.service';

interface BlogAuthor {
  name: string;
  role: string;
  avatar: string;
}

interface ContentBlock {
  contentType: 'text' | 'image';
  title?: string | null;
  data: string; // text content or image path
}

interface BlogPostData {
  slug: string;
  content: ContentBlock[];
  publishedDate?: string;
}

interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  image: string;
  imageAlt: string;
  author?: BlogAuthor;
  content?: ContentBlock[];
  publishedDate?: string;
}

interface BlogData {
  articles: BlogArticle[];
  featuredArticle?: BlogArticle;
}

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SiteHeaderComponent,
    SiteFooterComponent
  ],
  templateUrl: './blog-post.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogPostComponent implements OnInit, AfterViewInit {
  article: BlogArticle | null = null;
  relatedArticles: BlogArticle[] = [];
  loading = true;
  slug: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private titleService: Title,
    private metaService: Meta,
    private analytics: AnalyticsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  getSafeHtml(text: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(text);
  }

  get hasContent(): boolean {
    return !!(this.article?.content && this.article.content.length > 0);
  }

  get contentBlocks(): ContentBlock[] {
    return this.article?.content || [];
  }

  ngOnInit(): void {
    // Get slug from route
    this.route.params.subscribe(params => {
      this.slug = params['slug'];
      this.loadBlogPost();
    });

    // Add scroll event listener for header styling
    window.addEventListener('scroll', this.handleScroll.bind(this));
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Defer animations to avoid blocking initial render
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => {
          this.setupScrollAnimations();
        }, { timeout: 3000 });
      } else {
        setTimeout(() => {
          this.setupScrollAnimations();
        }, 500);
      }
    }
  }

  handleScroll(): void {
    const nav = document.querySelector('nav');
    if (nav) {
      if (window.scrollY > 50) {
        nav.classList.add('bg-white/98', 'shadow-sm');
      } else {
        nav.classList.remove('bg-white/98', 'shadow-sm');
      }
    }
  }

  loadBlogPost(): void {
    // First, load metadata from main blog data file
    this.http.get<BlogData>('assets/data/blog-data.json').subscribe({
      next: (data) => {
        // Find article by slug (check both articles and featuredArticle)
        let foundArticle = data.articles.find(article => article.slug === this.slug);
        
        // Also check featured article if it has a slug
        if (!foundArticle && data.featuredArticle && data.featuredArticle.slug === this.slug) {
          foundArticle = data.featuredArticle as BlogArticle;
        }
        
        if (foundArticle) {
          // Set basic article info
          this.article = { ...foundArticle };
          // Initialize content array if not present
          if (!this.article.content) {
            this.article.content = [];
          }
          
          // Track article view
          this.analytics.trackArticleView(foundArticle.title, foundArticle.slug);
          
          // Defer related articles loading to improve initial render
          if (isPlatformBrowser(this.platformId)) {
            requestIdleCallback(() => {
              this.loadRelatedArticles(data, foundArticle!);
              this.cdr.markForCheck();
            }, { timeout: 2000 });
          } else {
            this.loadRelatedArticles(data, foundArticle!);
          }
          
          // Now load the detailed content from the slug-based file
          this.loadBlogPostContent();
          this.cdr.markForCheck();
        } else {
          // Article not found, redirect to blog
          this.router.navigate(['/blog']);
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading blog post metadata:', error);
        this.loading = false;
        this.router.navigate(['/blog']);
      }
    });
  }

  loadBlogPostContent(): void {
    // Load detailed content from slug-based JSON file
    this.http.get<BlogPostData>(`assets/data/blog-posts/${this.slug}.json`).subscribe({
      next: (postData) => {
        if (this.article) {
          // Merge the content into the article
          this.article.content = postData.content || [];
          if (postData.publishedDate) {
            this.article.publishedDate = postData.publishedDate;
          }
          
          // Defer SEO updates to avoid blocking render
          if (isPlatformBrowser(this.platformId)) {
            requestIdleCallback(() => {
              this.updateSEOTags();
            }, { timeout: 2000 });
          } else {
            this.updateSEOTags();
          }
          
          // Mark for check instead of forcing detection
          this.cdr.markForCheck();
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading blog post content:', error);
        console.error('Attempted to load:', `assets/data/blog-posts/${this.slug}.json`);
        // If content file doesn't exist, still show the article but without content
        if (this.article) {
          this.article.content = [];
          if (isPlatformBrowser(this.platformId)) {
            requestIdleCallback(() => {
              this.updateSEOTags();
            }, { timeout: 2000 });
          } else {
            this.updateSEOTags();
          }
          this.cdr.markForCheck();
        }
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadRelatedArticles(data: BlogData, foundArticle: BlogArticle): void {
    this.relatedArticles = data.articles
      .filter(article => 
        article.slug &&
        article.category === foundArticle.category && 
        article.slug !== this.slug
      )
      .slice(0, 3);
    
    if (this.relatedArticles.length < 3) {
      const additional = data.articles
        .filter(article => article.slug && article.slug !== this.slug)
        .slice(0, 3 - this.relatedArticles.length);
      this.relatedArticles = [...this.relatedArticles, ...additional];
    }
  }

  updateSEOTags(): void {
    if (!this.article || !isPlatformBrowser(this.platformId)) {
      return;
    }

    const baseUrl = 'https://orcamo.ma';
    const articleUrl = `${baseUrl}/blog/${this.article.slug}`;
    const articleImage = this.article.image || `${baseUrl}/assets/logo-orcamo-icon.png`;
    const articleDescription = this.article.description || '';
    const articleTitle = `${this.article.title} | Orcamo Blog`;
    const authorName = this.article.author?.name || 'Orcamo Editorial Team';
    const publishedDate = this.article.publishedDate || new Date().toISOString().split('T')[0];

    // Update page title
    this.titleService.setTitle(articleTitle);

    // Basic meta tags
    this.metaService.updateTag({ name: 'description', content: articleDescription });
    this.metaService.updateTag({ name: 'keywords', content: `${this.article.category}, digital transformation, AI, automation, business strategy, Orcamo` });
    this.metaService.updateTag({ name: 'author', content: authorName });
    this.metaService.updateTag({ name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' });
    this.metaService.updateTag({ name: 'article:published_time', content: publishedDate });
    this.metaService.updateTag({ name: 'article:section', content: this.article.category });
    this.metaService.updateTag({ name: 'article:tag', content: this.article.category });

    // Open Graph tags for Facebook, LinkedIn, etc.
    this.metaService.updateTag({ property: 'og:type', content: 'article' });
    this.metaService.updateTag({ property: 'og:title', content: this.article.title });
    this.metaService.updateTag({ property: 'og:description', content: articleDescription });
    this.metaService.updateTag({ property: 'og:url', content: articleUrl });
    this.metaService.updateTag({ property: 'og:image', content: articleImage });
    this.metaService.updateTag({ property: 'og:image:alt', content: this.article.imageAlt });
    this.metaService.updateTag({ property: 'og:site_name', content: 'Orcamo' });
    this.metaService.updateTag({ property: 'og:locale', content: 'en_US' });
    if (this.article.author) {
      this.metaService.updateTag({ property: 'article:author', content: authorName });
    }

    // Twitter Card tags
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: this.article.title });
    this.metaService.updateTag({ name: 'twitter:description', content: articleDescription });
    this.metaService.updateTag({ name: 'twitter:image', content: articleImage });
    this.metaService.updateTag({ name: 'twitter:image:alt', content: this.article.imageAlt });
    this.metaService.updateTag({ name: 'twitter:site', content: '@orcamo' });

    // Canonical URL
    this.updateCanonicalUrl(articleUrl);

    // JSON-LD Structured Data for Article - defer to avoid blocking render
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        this.updateStructuredData();
      }, { timeout: 2000 });
    } else {
      setTimeout(() => {
        this.updateStructuredData();
      }, 100);
    }
  }

  private updateCanonicalUrl(url: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', url);
  }

  private updateStructuredData(): void {
    if (!this.article || !isPlatformBrowser(this.platformId)) return;

    // Remove existing structured data script if any
    const existingScript = document.querySelector('script[type="application/ld+json"][data-article]');
    if (existingScript) {
      existingScript.remove();
    }

    const baseUrl = 'https://orcamo.ma';
    const articleUrl = `${baseUrl}/blog/${this.article.slug}`;
    const publishedDate = this.article.publishedDate || new Date().toISOString().split('T')[0];
    const modifiedDate = new Date().toISOString().split('T')[0];

    // Extract text content from blocks for articleBody
    const articleBody = this.article.content
      ?.filter(block => block.contentType === 'text')
      .map(block => {
        // Remove HTML tags for clean text
        const text = block.data.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return block.title ? `${block.title}. ${text}` : text;
      })
      .join(' ')
      .substring(0, 5000) || this.article.description;

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': this.article.title,
      'description': this.article.description,
      'image': {
        '@type': 'ImageObject',
        'url': this.article.image,
        'width': 1200,
        'height': 630
      },
      'datePublished': publishedDate,
      'dateModified': modifiedDate,
      'author': {
        '@type': 'Person',
        'name': this.article.author?.name || 'Orcamo Editorial Team',
        'jobTitle': this.article.author?.role || 'Strategic Insights'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'Orcamo',
        'logo': {
          '@type': 'ImageObject',
          'url': `${baseUrl}/assets/logo-orcamo-icon.png`
        }
      },
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': articleUrl
      },
      'articleSection': this.article.category,
      'keywords': this.article.category,
      'articleBody': articleBody,
      'url': articleUrl,
      'wordCount': articleBody.split(' ').length
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-article', 'true');
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }

  setupScrollAnimations(): void {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -100px 0px'
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section-visible');
          sectionObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll('section, .blog-section');
    sections.forEach(section => {
      sectionObserver.observe(section);
    });

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => {
      const elementObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
            elementObserver.unobserve(entry.target);
          }
        });
      }, observerOptions);
      elementObserver.observe(el);
    });
  }

  scrollToSection(sectionId: string): void {
    // Navigate to landing page first, then scroll to section
    this.router.navigate(['/']).then(() => {
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    });
  }

  get articleUrl(): string {
    if (!this.article || !isPlatformBrowser(this.platformId)) {
      return '';
    }
    const baseUrl = window.location.origin;
    return `${baseUrl}/blog/${this.article.slug}`;
  }

  trackRelatedArticleClick(articleTitle: string, articleSlug: string): void {
    this.analytics.trackEvent('related_article_click', {
      event_category: 'content',
      event_label: articleTitle,
      article_slug: articleSlug
    });
  }

  shareArticle(): void {
    if (!this.article || !isPlatformBrowser(this.platformId)) {
      return;
    }

    // Track social share
    this.analytics.trackSocialShare('native_share', this.article.title);

    const shareData = {
      title: this.article.title,
      text: this.article.description,
      url: this.articleUrl
    };

    // Check if Web Share API is available (mobile devices)
    if (navigator.share) {
      navigator.share(shareData).catch((error) => {
        // User cancelled or error occurred, fallback to copy link
        if (error.name !== 'AbortError') {
          this.copyLink();
        }
      });
    } else {
      // Fallback to copy link
      this.copyLink();
    }
  }

  shareOnLinkedIn(): void {
    if (!this.article || !isPlatformBrowser(this.platformId)) {
      return;
    }

    // Track social share
    this.analytics.trackSocialShare('linkedin', this.article.title);

    const url = encodeURIComponent(this.articleUrl);
    const title = encodeURIComponent(this.article.title);
    const summary = encodeURIComponent(this.article.description);
    
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
  }

  shareOnTwitter(): void {
    if (!this.article || !isPlatformBrowser(this.platformId)) {
      return;
    }

    // Track social share
    this.analytics.trackSocialShare('twitter', this.article.title);

    const url = encodeURIComponent(this.articleUrl);
    const text = encodeURIComponent(`${this.article.title} - ${this.article.description}`);
    
    const twitterUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  }

  copyLink(): void {
    if (!this.article || !isPlatformBrowser(this.platformId)) {
      return;
    }

    // Track link copy
    this.analytics.trackEvent('link_copy', {
      event_category: 'engagement',
      event_label: this.article.title
    });

    navigator.clipboard.writeText(this.articleUrl).then(() => {
      // Show feedback to user
      this.showCopyFeedback();
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = this.articleUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        this.showCopyFeedback();
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
      document.body.removeChild(textArea);
    });
  }

  private showCopyFeedback(): void {
    // Create a temporary toast notification
    const toast = document.createElement('div');
    toast.textContent = 'Link copied to clipboard!';
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #1a1a1a;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        document.body.removeChild(toast);
        document.head.removeChild(style);
      }, 300);
    }, 2000);
  }
}

