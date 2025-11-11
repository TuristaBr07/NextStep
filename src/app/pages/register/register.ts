import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common';
import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notification.service';

/**
 * Página de cadastro. Permite que novos usuários criem uma conta
 * informando nome completo, e‑mail e senha. Utiliza o AuthService
 * para delegar a criação à API de autenticação do Supabase.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, NgIf, RouterLink, FormsModule],
  templateUrl: './register.html'
})
export class Register {
  fullName = '';
  email = '';
  password = '';

  /**
   * Campo de confirmação de senha. Utilizado para validar se o
   * usuário digitou corretamente a mesma senha duas vezes.
   */
  confirmPassword = '';
  isLoading = false;

  /**
   * Mensagem de feedback para o usuário. Pode ser usada para
   * exibir erros de validação ou sucesso no cadastro.
   */
  // message = ''; // Removido, usaremos o NotificationService

  constructor(private authService: AuthService, private notificationService: NotificationService) {}

  /**
   * Realiza o cadastro do usuário. Caso e‑mail e senha estejam
   * preenchidos, delega ao AuthService a criação no Supabase.
   */
  async fazerRegistro(): Promise<void> {
    // Valida campos obrigatórios
    if (!this.email || !this.password || !this.confirmPassword) {
      this.notificationService.error('Por favor, preencha e‑mail, senha e confirmação.');
      return;
    }
    // Verifica se as senhas coincidem
    if (this.password !== this.confirmPassword) {
      this.notificationService.error('As senhas não coincidem. Verifique e tente novamente.');
      return;
    }

    this.isLoading = true;
    try {
      await this.authService.register(this.email, this.password, this.fullName);
      this.notificationService.success('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta.');
    } catch (err: any) {
      console.error('Falha ao registrar:', err);
      this.notificationService.error(err?.message || 'Não foi possível realizar o cadastro. Tente novamente.');
    } finally {
      this.isLoading = false;
    }
  }
}