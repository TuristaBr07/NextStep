import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationSubject = new BehaviorSubject<Notification | null>(null);
  public notification$: Observable<Notification | null> = this.notificationSubject.asObservable();
  private nextId = 0;

  constructor() {}

  show(message: string, type: 'success' | 'error' | 'info') {
    const notification: Notification = {
      id: this.nextId++,
      message,
      type,
    };
    this.notificationSubject.next(notification);
  }

  success(message: string) {
    this.show(message, 'success');
  }

  error(message: string) {
    this.show(message, 'error');
  }

  info(message: string) {
    this.show(message, 'info');
  }

  clear() {
    this.notificationSubject.next(null);
  }
}
