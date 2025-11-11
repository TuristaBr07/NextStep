import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Transaction } from '../models/transaction';
import { SupabaseService } from './supabase.service';

/**
 * Serviço responsável por gerenciar as transações financeiras. Este
 * serviço abstrai o acesso ao armazenamento local (localStorage)
 * oferecendo métodos para criar, atualizar, excluir e listar
 * transações. Ele utiliza um BehaviorSubject para disponibilizar
 * alterações em tempo real aos componentes que consomem as
 * transações.
 */
@Injectable({ providedIn: 'root' })
export class TransactionService {
  /**
   * Fluxo reativo das transações. Inicializa vazio e é preenchido
   * quando fetchTransactions() for chamado.
   */
  private readonly transactionsSubject = new BehaviorSubject<Transaction[]>([]);

  /** Observável que expõe a lista de transações ao mundo exterior. */
  public readonly transactions$: Observable<Transaction[]> = this.transactionsSubject.asObservable();

  constructor(private supabaseService: SupabaseService) {
    // Ao instanciar o serviço, carregamos as transações do banco
    this.fetchTransactions().catch(err => console.error('Erro inicial ao buscar transações:', err));
  }

  /**
   * Recupera todas as transações atualmente armazenadas. O retorno
   * contém cópias dos objetos para evitar mutações externas.
   */
  getTransactions(): Transaction[] {
    return this.transactionsSubject.getValue().map(tx => ({ ...tx }));
  }

  /**
   * Adiciona uma nova transação. Atribui um id automático baseado
   * no timestamp atual. Após a inclusão, notifica os assinantes
   * do BehaviorSubject e persiste as alterações no localStorage.
   * Caso possível, dispara uma notificação nativa do navegador
   * informando a criação.
   */
  async addTransaction(tx: Omit<Transaction, 'id'>): Promise<void> {
    try {
      // Obtém o usuário atual para associar a transação
      const { data: sessionData } = await this.supabaseService.client.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }
      const { error } = await this.supabaseService.client
        .from('transactions')
        .insert([{ ...tx, user_id: userId }]);
      if (error) {
        console.error('Erro ao inserir transação:', error.message);
        return;
      }
      await this.fetchTransactions();
      this.notify('Transação criada', `Uma nova ${tx.type.toLowerCase()} foi registrada.`);
    } catch (err) {
      console.error('Falha ao adicionar transação:', err);
    }
  }

  /**
   * Atualiza uma transação existente. Recebe o id e os campos a
   * atualizar. Se a transação não existir, nada é feito.
   */
  async updateTransaction(id: number, partial: Partial<Omit<Transaction, 'id'>>): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from('transactions')
        .update(partial)
        .eq('id', id);
      if (error) {
        console.error('Erro ao atualizar transação:', error.message);
        return;
      }
      await this.fetchTransactions();
    } catch (err) {
      console.error('Falha ao atualizar transação:', err);
    }
  }

  /**
   * Remove uma transação pelo seu id. Se a transação não existir,
   * não faz nada.
   */
  async deleteTransaction(id: number): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('Erro ao excluir transação:', error.message);
        return;
      }
      await this.fetchTransactions();
    } catch (err) {
      console.error('Falha ao excluir transação:', err);
    }
  }

  /**
   * Carrega as transações do localStorage. Caso não haja dados
   * previamente salvos, retorna um array vazio. A conversão de
   * valores numéricos é realizada para garantir que o campo
   * `amount` seja do tipo number.
   */
  /**
   * Busca as transações do usuário logado no Supabase e atualiza o
   * BehaviorSubject. Se não houver usuário, define lista vazia.
   */
  async fetchTransactions(): Promise<void> {
    try {
      const { data: sessionData } = await this.supabaseService.client.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        this.transactionsSubject.next([]);
        return;
      }
      const { data, error } = await this.supabaseService.client
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });
      if (error) {
        console.error('Erro ao carregar transações:', error.message);
        this.transactionsSubject.next([]);
        return;
      }
      // Convertemos amount para número, pois o Supabase retorna string
      const parsed = (data ?? []).map(item => ({
        ...item,
        amount: Number((item as any).amount)
      })) as Transaction[];
      this.transactionsSubject.next(parsed);
    } catch (err) {
      console.error('Falha ao buscar transações:', err);
      this.transactionsSubject.next([]);
    }
  }

  /**
   * Salva o array de transações e emite o novo estado.
   * Este método não é mais utilizado porque as transações agora são
   * persistidas remotamente no Supabase. Ele permanece aqui apenas
   * por compatibilidade do código legado.
   */
  private updateStore(transactions: Transaction[]): void {
    this.transactionsSubject.next(transactions);
  }

  /**
   * Tenta exibir uma notificação nativa do navegador. O usuário
   * precisa ter concedido permissão para que a notificação seja
   * exibida. Caso a permissão ainda não tenha sido solicitada,
   * o método pede permissão e exibe a notificação assim que
   * concedida. Se o navegador não suportar notificações, nada é
   * feito.
   */
  private notify(title: string, body: string): void {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      });
    }
  }
}