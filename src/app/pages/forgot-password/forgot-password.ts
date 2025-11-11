import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';

/**
 * Página de recuperação de senha. O usuário informa seu e‑mail e
 * recebe um link para redefinição via Supabase.
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './forgot-password.html'
})
export class ForgotPassword {
  email = '';
  message: string | null = null;

  constructor(private authService: AuthService) {}

  /**
   * Envia o e‑mail de redefinição de senha. Exibe uma mensagem de
   * sucesso ou loga erros no console.
   */
  async enviarLink(): Promise<void> {
    if (!this.email) {
      console.warn('Informe seu e‑mail.');
      return;
    }
    try {
      await this.authService.sendPasswordReset(this.email);
      this.message = 'Se houver uma conta para este e‑mail, um link foi enviado.';
    } catch (err) {
      console.error('Falha ao enviar link de redefinição:', err);
    }
  }
}