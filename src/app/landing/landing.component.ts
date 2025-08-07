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
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      service: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    // Add scroll event listener for header styling
    window.addEventListener('scroll', this.handleScroll.bind(this));
  }

  ngAfterViewInit(): void {
    this.setupScrollAnimations();
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

  setupScrollAnimations(): void {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
        }
      });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.service-card, .step, .testimonial-card');
    animateElements.forEach(el => {
      observer.observe(el);
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
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('service', formData.service);
      formDataToSend.append('message', formData.message);
      formDataToSend.append('_subject', 'Nouveau devis Orcamo');
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
      if (field.errors['required']) return 'Ce champ est requis';
      if (field.errors['email']) return 'Email invalide';
      if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
    }
    return '';
  }
} 