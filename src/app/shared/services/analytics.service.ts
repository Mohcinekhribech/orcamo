import { Injectable, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService implements OnDestroy {
  private measurementId: string = 'G-LGEXMYRRB7';
  private routerSubscription?: Subscription;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.trackPageViews();
    }
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private trackPageViews(): void {
    // Track page views on navigation
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.trackPageView(event.urlAfterRedirects);
        }
      });
  }

  /**
   * Track a page view
   */
  trackPageView(url: string): void {
    if (!isPlatformBrowser(this.platformId) || !window.gtag) {
      return;
    }

    window.gtag('config', this.measurementId, {
      page_path: url,
      page_title: document.title
    });
  }

  /**
   * Track an event
   */
  trackEvent(
    eventName: string,
    eventParams?: {
      event_category?: string;
      event_label?: string;
      value?: number;
      [key: string]: any;
    }
  ): void {
    if (!isPlatformBrowser(this.platformId) || !window.gtag) {
      return;
    }

    window.gtag('event', eventName, eventParams);
  }

  /**
   * Track button clicks
   */
  trackButtonClick(buttonName: string, location?: string): void {
    this.trackEvent('button_click', {
      event_category: 'engagement',
      event_label: buttonName,
      button_location: location
    });
  }

  /**
   * Track form submissions
   */
  trackFormSubmit(formName: string): void {
    this.trackEvent('form_submit', {
      event_category: 'engagement',
      event_label: formName
    });
  }

  /**
   * Track article views
   */
  trackArticleView(articleTitle: string, articleSlug: string): void {
    this.trackEvent('article_view', {
      event_category: 'content',
      event_label: articleTitle,
      article_slug: articleSlug
    });
  }

  /**
   * Track social shares
   */
  trackSocialShare(platform: string, articleTitle?: string): void {
    this.trackEvent('social_share', {
      event_category: 'social',
      event_label: platform,
      article_title: articleTitle
    });
  }
}




