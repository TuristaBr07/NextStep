import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="notification" [ngClass]="getNotificationClasses()">
      {{ notification.message }}
      <button (click)="close()" class="close-btn">X</button>
    </div>
  `,
  styles: [
    `
      .notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-width: 300px;
        transition: opacity 0.3s ease-in-out;
      }
      .success {
        background-color: #4caf50; /* Green */
      }
      .error {
        background-color: #f44336; /* Red */
      }
      .info {
        background-color: #2196f3; /* Blue */
      }
      .close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        margin-left: 15px;
      }
    `,
  ],
})
export class NotificationComponent {
  @Input() notification: Notification | null = null;
  @Input() duration: number = 5000; // 5 seconds

  private timeout: any;

  ngOnChanges() {
    if (this.notification) {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.close();
      }, this.duration);
    }
  }

  getNotificationClasses() {
    return {
      'notification-container': true,
      [this.notification?.type || 'info']: true,
    };
  }

  close() {
    this.notification = null;
    clearTimeout(this.timeout);
  }
}
