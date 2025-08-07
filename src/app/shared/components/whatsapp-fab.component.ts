import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-whatsapp-fab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './whatsapp-fab.component.html'
})
export class WhatsappFabComponent {
  openWhatsApp(): void {
    const message = encodeURIComponent('Salam Orcamo, bghit devis');
    const url = `https://wa.me/212606859886?text=${message}`;
    window.open(url, '_blank');
  }
} 