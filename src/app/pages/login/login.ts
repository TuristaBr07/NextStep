import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './login.html'
})
export class Login {
  email = '';
  password = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  async fazerLogin(): Promise<void> {
    this.isLoading = true;

    try {
      await this.authService.login(this.email, this.password);
      this.notificationService.show('Login realizado com sucesso!', 'success');
      await this.router.navigate(['/dashboard']);
    } catch (error: any) {
      
      // *** INÍCIO DA CORREÇÃO ***
      let errorMessage: string;

      // Verifica a mensagem de erro específica do Supabase
      if (error?.message === 'Invalid login credentials') {
        errorMessage = 'Email ou senha inválidos. Por favor, tente novamente.';
      } else {
        // Mensagem genérica para outros erros (rede, etc.)
        errorMessage = 'Falha ao realizar login. Tente mais tarde.';
      }
      
      // Mostra a mensagem padronizada em português
      this.notificationService.show(errorMessage, 'error');
      // *** FIM DA CORREÇÃO ***

    } finally {
      this.isLoading = false;
    }
  }
}