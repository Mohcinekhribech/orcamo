import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SiteHeaderComponent } from '../shared/components/site-header.component';
import { SiteFooterComponent } from '../shared/components/site-footer.component';
import { WhatsappFabComponent } from '../shared/components/whatsapp-fab.component';
import { SectionComponent } from '../shared/ui/section.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SiteHeaderComponent,
    SiteFooterComponent,
    WhatsappFabComponent,
    SectionComponent
  ],
  templateUrl: './landing.component.html'
})
export class LandingComponent implements OnInit, AfterViewInit {
  contactForm: FormGroup;
  isSubmitted = false;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      company: ['', Validators.required],
      projectType: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    // Add scroll event listener for header styling
    window.addEventListener('scroll', this.handleScroll.bind(this));
  }

  ngAfterViewInit(): void {
    // Small delay to ensure DOM is fully rendered
    setTimeout(() => {
      this.setupScrollAnimations();
      this.animateHeroSection();
    }, 100);
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

  animateHeroSection(): void {
    // Animate hero elements on load
    const heroBadge = document.querySelector('.hero-badge');
    const heroTitle = document.querySelector('.hero-title');
    const heroDescription = document.querySelector('.hero-description');
    const heroButtons = document.querySelectorAll('.hero-button');
    const heroImage = document.querySelector('.hero-image');
    const heroCard = document.querySelector('.hero-card');
    const heroLogos = document.querySelectorAll('.hero-logo');

    if (heroBadge) {
      setTimeout(() => heroBadge.classList.add('animate-fade-in-up'), 100);
    }
    if (heroTitle) {
      setTimeout(() => heroTitle.classList.add('animate-fade-in-up'), 200);
    }
    if (heroDescription) {
      setTimeout(() => heroDescription.classList.add('animate-fade-in-up'), 300);
    }
    heroButtons.forEach((btn, index) => {
      setTimeout(() => btn.classList.add('animate-fade-in-up'), 400 + (index * 100));
    });
    if (heroImage) {
      setTimeout(() => heroImage.classList.add('animate-scale-in'), 500);
    }
    if (heroCard) {
      setTimeout(() => heroCard.classList.add('animate-slide-up'), 700);
    }
    heroLogos.forEach((logo, index) => {
      setTimeout(() => logo.classList.add('animate-fade-in'), 800 + (index * 100));
    });
  }

  setupScrollAnimations(): void {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -100px 0px'
    };

    // Main section observer
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section-visible');
          // Stop observing once animated
          sectionObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Staggered children observer
    const staggerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const children = entry.target.querySelectorAll('.animate-on-scroll');
          children.forEach((child, index) => {
            setTimeout(() => {
              child.classList.add('animate-fade-in-up');
            }, index * 100);
          });
          staggerObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
      sectionObserver.observe(section);
    });

    // Observe staggered containers
    const staggerContainers = document.querySelectorAll('.stagger-container');
    staggerContainers.forEach(container => {
      staggerObserver.observe(container);
    });

    // Observe individual animated elements
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
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  openWhatsApp(): void {
    const message = encodeURIComponent('Salam Orcamo, bghit devis');
    const url = `https://wa.me/212612345678?text=${message}`;
    window.open(url, '_blank');
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      const formData = this.contactForm.value;
      
      // Log the payload
      console.log('Contact form submitted:', formData);
      
      // Create FormData for Formspree
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('company', formData.company);
      formDataToSend.append('projectType', formData.projectType);
      formDataToSend.append('message', formData.message);
      formDataToSend.append('_subject', 'New Contact Form - Orcamo');
      formDataToSend.append('_captcha', 'false');
      formDataToSend.append('_template', 'table');
      
      // Send to Formspree
      fetch('https://formspree.io/f/mqalywdz', {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Accept': 'application/json'
        }
      })
      .then(response => {
        if (response.ok) {
          this.isSubmitted = true;
          this.contactForm.reset();
          setTimeout(() => {
            this.isSubmitted = false;
          }, 3000);
        } else {
          console.error('Form submission failed');
        }
      })
      .catch(error => {
        console.error('Error submitting form:', error);
      });
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['email']) return 'Invalid email';
      if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }
} 