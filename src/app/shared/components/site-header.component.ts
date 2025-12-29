import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './site-header.component.html'
})
export class SiteHeaderComponent {
  isMobileMenuOpen = false;

  constructor(private router: Router) {}

  scrollToSection(sectionId: string): void {
    // Check if we're on the landing page
    if (this.router.url === '/' || this.router.url === '') {
      // We're on the landing page, just scroll to the section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // We're on another page, navigate to landing page first, then scroll
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
    // Close mobile menu if open
    if (this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
} 