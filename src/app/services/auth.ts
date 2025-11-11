import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
// Importamos tipagens do Supabase para melhor intellisense. Se o pacote
// @supabase/supabase-js não estiver instalado, você pode ignorar
// estas importações até executar `npm install @supabase/supabase-js`.
import { AuthResponse, Session } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /**
   * Construtor do serviço. O SupabaseService fornece o cliente
   * compartilhado e o Router permite navegação após login/logout.
   */
  constructor(private router: Router, private supabaseService: SupabaseService) {
    // Obtém a sessão atual assim que o serviço é instanciado. Isso
    // garante que o valor inicial de loggedInSubject reflita o
    // estado real do usuário ao carregar a aplicação.
    this.supabaseService.client.auth
      .getSession()
      .then(({ data }) => {
        this.loggedInSubject.next(!!data.session?.user);
      })
      .catch(() => {
        this.loggedInSubject.next(false);
      });
    // Escuta mudanças de sessão (login, logout, refresh) para
    // atualizar o estado. Sem esta subscrição, o BehaviourSubject
    // permaneceria no valor inicial mesmo após autenticação.
    this.supabaseService.client.auth.onAuthStateChange((_event, session) => {
      this.loggedInSubject.next(!!session?.user);
    });
  }

  /**
   * BehaviorSubject que mantém o estado atual de autenticação. É
   * inicializado como falso até que a sessão seja recuperada do
   * Supabase. Os componentes podem assinar `isLoggedIn$` para
   * reagir a mudanças de sessão sem disparar requisições contínuas.
   */
  private readonly loggedInSubject = new BehaviorSubject<boolean>(false);

  /**
   * Observable exposto para verificar se o usuário está logado. Use
   * `| async` nos templates para obter o valor atual. Não use este
   * campo diretamente para navegação (use o método isLoggedIn()).
   */
  public readonly isLoggedIn$: Observable<boolean> = this.loggedInSubject.asObservable();

  /**
   * Realiza login utilizando o serviço de autenticação do Supabase.
   * Se o login for bem‑sucedido, retorna.
   * Em caso de erro (ex: senha errada), o erro é LANÇADO para o componente.
   */
  async login(email: string, pass: string): Promise<void> {
    try {
      const { data, error }: AuthResponse = await this.supabaseService.client.auth.signInWithPassword({
        email,
        password: pass
      });
      
      // *** INÍCIO DA CORREÇÃO ***
      if (error) {
        console.error('Erro de login:', error.message);
        // Lança o erro para que o login.ts possa apanhá-lo no 'catch'
        throw new Error(error.message);
      }
      
      // Sucesso: Apenas retorna. O componente de login (login.ts)
      // será responsável por navegar para o dashboard.
      // this.router.navigate(['/dashboard']); // <-- REMOVIDO
      // *** FIM DA CORREÇÃO ***

    } catch (err: any) {
      console.error('Falha ao tentar login:', err);
      // Garante que qualquer outro erro (ex: rede) também seja lançado
      throw err;
    }
  }

  /**
   * Encerra a sessão atual no Supabase e redireciona para a página
   * de login. Caso ocorra algum problema durante o signOut, o erro
   * é logado no console.
   */
  async logout(): Promise<void> {
    try {
      const { error } = await this.supabaseService.client.auth.signOut();
      if (error) {
        console.error('Erro ao sair:', error.message);
      }
    } finally {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Verifica se existe uma sessão ativa. Retorna true se o usuário
   * estiver logado no Supabase, false caso contrário.
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const { data, error }: { data: { session: Session | null }; error: any } =
        await this.supabaseService.client.auth.getSession();
      if (error) {
        console.error('Erro ao obter sessão:', error.message);
        return false;
      }
      return !!data.session?.user;
    } catch (err) {
      console.error('Falha ao verificar sessão:', err);
      return false;
    }
  }

  /**
   * Cria uma nova conta de usuário no Supabase. Recebe e‑mail,
   * senha e opcionalmente o nome completo. Após criar a conta, o
   * Supabase envia um e‑mail de confirmação se este recurso estiver
   * habilitado. Não realiza login automaticamente.
   */
  async register(email: string, password: string, fullName?: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.client.auth.signUp({
        email,
        password,
        // Removida a criação de perfil aqui para evitar race condition.
        // A criação do perfil será feita por um Database Trigger no Supabase.
        // options: {
        //   data: fullName ? { full_name: fullName } : undefined
        // }
      });
      if (error) {
        console.error('Erro ao registrar usuário:', error.message);
        // Lançamos o erro para que o componente de registro possa tratá-lo
        throw new Error(error.message);
      }
      // Após o registro, navegamos para a tela de login
      this.router.navigate(['/login']);
    } catch (err) {
      console.error('Falha ao registrar usuário:', err);
      // Lançamos o erro para que o componente de registro possa tratá-lo
      throw err;
    }
  }

  /**
   * Envia um e‑mail com link de redefinição de senha para o usuário.
   * O Supabase cuida de enviar o e‑mail para o endereço informado.
   */
  async sendPasswordReset(email: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.client.auth.resetPasswordForEmail(email);
      if (error) {
        console.error('Erro ao solicitar redefinição de senha:', error.message);
        // Lança o erro para o componente (forgot-password.ts)
        throw new Error(error.message);
      } else {
        console.info('Solicitação de redefinição de senha enviada para', email);
      }
    } catch (err: any) {
      console.error('Falha ao enviar redefinição de senha:', err);
      // Lança o erro para o componente
      throw err;
    }
  }
}