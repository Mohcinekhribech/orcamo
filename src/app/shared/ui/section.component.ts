import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section.component.html'
})
export class SectionComponent {
  @Input() id?: string;
  @Input() className?: string;
} 