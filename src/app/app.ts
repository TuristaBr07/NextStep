import { Component } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
// 1. Corrigido: 'RouterLink' removido pois não é usado no app.html
import { RouterOutlet } from '@angular/router'; 
import { NotificationComponent } from './components/notification/notification';
import { NotificationService } from './services/notification.service';
import { Observable } from 'rxjs';
// 2. Corrigido: A interface 'Notification' está no ficheiro do serviço, não em 'models/'
import { Notification } from './services/notification.service'; 

@Component({
  selector: 'app-root',
  standalone: true,
  // 3. Corrigido: 'RouterLink' removido dos imports
  imports: [CommonModule, RouterOutlet, NotificationComponent, AsyncPipe],
  templateUrl: './app.html'
})
export class AppComponent {
  notification$: Observable<Notification | null>;

  constructor(private notificationService: NotificationService) {
    this.notification$ = this.notificationService.notification$;
  }
}