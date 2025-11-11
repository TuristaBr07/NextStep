import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { Transaction } from '../../models/transaction';
import { Category } from '../../models/category';
import { AuthService } from '../../services/auth';
import { TransactionService } from '../../services/transaction';
import { CategoryService } from '../../services/category';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf, NgClass, RouterLink, FormsModule],
  templateUrl: './transactions.html',
  styleUrls: ['./transactions.css']
})
export class Transactions implements OnInit, OnDestroy {
  // Observables para os dados
  public categories$: Observable<Category[]>;
  private transactionsSub?: Subscription;

  // Listas de dados
  private allTransactions: Transaction[] = [];
  public filteredTransactions: Transaction[] = [];

  // Modelos dos filtros
  filterText = '';
  filterType: 'Todos' | 'Receita' | 'Despesa' = 'Todos';
  filterCategory = 'Todas';

  // --- Lógica do Modal (Copiada do Dashboard) ---
  showModal = false;
  isSaving = false;
  editing: Transaction | null = null;
  form: Partial<Transaction> = {
    date: '', type: 'Receita', category: '', description: '', amount: 0
  };
  // ---------------------------------------------

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private notificationService: NotificationService
  ) {
    // Expõe os observables dos serviços
    this.categories$ = this.categoryService.categories$;
  }

  ngOnInit(): void {
    // Assina as transações. Quando chegarem, guarda no cache local e filtra.
    this.transactionsSub = this.transactionService.transactions$.subscribe(transactions => {
      this.allTransactions = transactions.sort((a, b) => b.date.localeCompare(a.date)); // Ordena por mais recente
      this.filtrar();
    });
  }

  ngOnDestroy(): void {
    this.transactionsSub?.unsubscribe();
  }

  /** Filtra a lista 'allTransactions' com base nos filtros da tela */
  filtrar(): void {
    const textoBusca = this.filterText.toLowerCase();

    this.filteredTransactions = this.allTransactions.filter(tx => {
      // 1. Filtro por Tipo
      const typeMatch = this.filterType === 'Todos' || tx.type === this.filterType;
      
      // 2. Filtro por Categoria
      const categoryMatch = this.filterCategory === 'Todas' || tx.category === this.filterCategory;

      // 3. Filtro por Texto (na descrição)
      const textMatch = this.filterText === '' || tx.description.toLowerCase().includes(textoBusca);

      return typeMatch && categoryMatch && textMatch;
    });
  }

  /** Realiza logout */
  fazerLogout(): void {
    this.authService.logout();
  }

  // --- Métodos do Modal (Copiados do Dashboard) ---

  openModal(tx?: Transaction): void {
    this.editing = tx ?? null;
    if (tx) {
      this.form = {
        date: tx.date, type: tx.type, category: tx.category, description: tx.description, amount: tx.amount
      };
    } else {
      this.form = {
        date: new Date().toISOString().split('T')[0], type: 'Receita', category: '', description: '', amount: 0
      };
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editing = null;
  }

  async saveTransaction(): Promise<void> {
    if (!this.form.date || !this.form.type || !this.form.category || !this.form.description || this.form.amount == null) {
      this.notificationService.error("Por favor, preencha todos os campos.");
      return;
    }
    const amountNumber = Number(this.form.amount);
    if (isNaN(amountNumber)) return;

    this.isSaving = true;
    try {
      if (this.editing) {
        await this.transactionService.updateTransaction(this.editing.id, {
          date: this.form.date,
          type: this.form.type as 'Receita' | 'Despesa',
          category: this.form.category ?? '',
          description: this.form.description ?? '',
          amount: amountNumber
        });
        this.notificationService.success("Transação atualizada!");
      } else {
        await this.transactionService.addTransaction({
          date: this.form.date,
          type: this.form.type as 'Receita' | 'Despesa',
          category: this.form.category ?? '',
          description: this.form.description ?? '',
          amount: amountNumber
        });
        this.notificationService.success("Transação salva!");
      }
      this.closeModal();
    } catch (error: any) {
      this.notificationService.error('Erro ao salvar: ' + error.message);
    } finally {
      this.isSaving = false;
    }
  }

  async deleteTransaction(id: number): Promise<void> {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await this.transactionService.deleteTransaction(id);
        this.notificationService.success("Transação excluída!");
      } catch (error: any) {
        this.notificationService.error('Erro ao excluir: ' + error.message);
      }
    }
  }
}