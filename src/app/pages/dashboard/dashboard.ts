import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core'; // 1. Importar OnInit
import { RouterLink } from '@angular/router';
import { CommonModule, NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { TransactionService } from '../../services/transaction';
import { CategoryService } from '../../services/category';
import { Category } from '../../models/category';
import { Transaction } from '../../models/transaction';
import { Subscription, Observable } from 'rxjs'; // 2. Importar Observable
import { SupabaseService } from '../../services/supabase.service'; // <-- ADICIONADO

// Chart é carregado globalmente via script em index.html; declaramos para o TypeScript
declare const Chart: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, NgIf, NgFor, NgClass], // CommonModule já inclui o AsyncPipe
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
// 3. Implementar OnInit
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  
  // 4. Expor o Observable para o template (para usar o AsyncPipe)
  public transactions$: Observable<Transaction[]>;

  /** Observable de categorias carregadas do banco. */
  public categories$!: Observable<Category[]>;

  /** Nome do usuário para a saudação. */
  public profileName: string | null = null; // <-- ADICIONADO

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private supabaseService: SupabaseService // <-- ADICIONADO
  ) {
    // Atribuir observáveis
    this.transactions$ = this.transactionService.transactions$;
    // Atribui o observable de categorias após injeção
    this.categories$ = this.categoryService.categories$;
  }

  /** Inscrição nas alterações de transações para atualizar KPIs e gráfico. */
  private sub?: Subscription;

  /** Controle de exibição do formulário/modal. */
  showModal = false;
  /** Flag para indicar que a transação está sendo salva. */
  isSaving = false;

  /** Se definido, indica que estamos editando uma transação existente. */
  editing: Transaction | null = null;

  /** Modelo do formulário utilizado para criar/editar uma transação. */
  form: Partial<Transaction> = {
    date: '',
    type: 'Receita',
    category: '',
    description: '',
    amount: 0
  };

  /**
   * A propriedade `categories$` é exposta acima e substitui a lista
   * estática de categorias. As categorias agora são carregadas do
   * banco de dados via CategoryService.
   */

  /** Propriedades computadas para exibição de KPI. */
  balance = 0;
  totalIncome = 0;
  // Limite MEI fixo em R$ 81.000,00
  readonly MEI_LIMIT = 81000.0;
  meiLimitProgress = 0;
  totalExpense = 0;
  incomeCount = 0;
  expenseCount = 0;

  /** Instância do gráfico; utilizada para destruição e recriação. */
  private chart: any;

  /**
   * Indica se os dados iniciais ainda estão sendo carregados. Esta
   * flag é usada para prevenir o "piscar" dos indicadores quando
   * `fetchTransactions()` é chamado no serviço e os valores ainda
   * não foram recebidos. Os KPI cards e o gráfico só são
   * exibidos quando `isLoading` é false.
   */
  isLoading = true;

  /** Carrega o nome do perfil para a saudação. */
  private async loadProfile(): Promise<void> {
    try {
      const { data: sessionData } = await this.supabaseService.client.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;

      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('full_name') // Só precisamos do nome
        .eq('id', userId)
        .maybeSingle(); // Usamos o maybeSingle() que corrigimos

      if (error) {
        console.error('Erro ao carregar perfil no dashboard:', error.message);
        return;
      }
      
      // Se achou o nome e ele não está vazio
      if (data && data.full_name) {
        // Pega o primeiro nome para uma saudação mais amigável
        this.profileName = data.full_name.split(' ')[0]; 
      }
    } catch (err) {
      console.error('Falha ao carregar perfil no dashboard:', err);
    }
  }

  // 7. Implementar ngOnInit
  ngOnInit(): void {
    this.loadProfile(); // <-- ADICIONADO
    // Ao iniciali    // A subscrição agora atualiza KPIs E o gráfico
    this.sub = this.transactionService.transactions$.subscribe(() => {
      // A subscrição agora atualiza KPIs E o gráfico
      this.calculateKPIs();
      this.drawChart();
      // Marcamos que os dados já foram carregados pelo menos uma vez
      this.isLoading = false;
    });   
    // 8. Primeira atualização dos KPIs (apenas KPIs, o gráfico espera o ngAfterViewInit)
    this.calculateKPIs();
    // Manter isLoading true aqui; ele será desligado quando os dados forem recebidos
  }

  ngAfterViewInit(): void {
    // 9. O AfterViewInit agora só desenha o gráfico inicial
    // Os dados já foram calculados no ngOnInit
    this.drawChart();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.chart?.destroy();
  }

  /** Realiza logout via serviço de autenticação. */
  fazerLogout(): void {
    this.authService.logout();
  }

  /** Abre o formulário para criação ou edição de transação. */
  openModal(tx?: Transaction): void {
    this.editing = tx ?? null;
    if (tx) {
      // Copiamos os campos para o formulário a partir da transação existente
      this.form = {
        date: tx.date,
        type: tx.type,
        category: tx.category,
        description: tx.description,
        amount: tx.amount
      };
    } else {
      // Reset do formulário para uma nova transação
      this.form = {
        date: new Date().toISOString().split('T')[0],
        type: 'Receita',
        category: '',
        description: '',
        amount: 0
      };
    }
    this.showModal = true;
  }

  /** Fecha a modal e limpa o estado de edição. */
  closeModal(): void {
    this.showModal = false;
    this.editing = null;
  }

  /** Persiste a transação informada no formulário. */
  async saveTransaction(): Promise<void> {
    // Asseguramos que os campos obrigatórios estejam presentes
    if (!this.form.date || !this.form.type || !this.form.category || !this.form.description || this.form.amount == null) {
      return;
    }
    const amountNumber = Number(this.form.amount);
    if (isNaN(amountNumber)) return;

    this.isSaving = true;
    try {
      if (this.editing) {
        // Editando existente
        await this.transactionService.updateTransaction(this.editing.id, {
          date: this.form.date,
          type: this.form.type as 'Receita' | 'Despesa',
          category: this.form.category ?? '',
          description: this.form.description ?? '',
          amount: amountNumber
        });
      } else {
        // Criando nova
        await this.transactionService.addTransaction({
          date: this.form.date,
          type: this.form.type as 'Receita' | 'Despesa',
          category: this.form.category ?? '',
          description: this.form.description ?? '',
          amount: amountNumber
        });
      }
      this.closeModal();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      // Aqui seria ideal usar o NotificationService, mas ele não foi injetado neste componente.
      // Assumindo que o TransactionService já lida com notificações de erro.
    } finally {
      this.isSaving = false;
    }
  }

  /** Exclui uma transação pelo id. */
  deleteTransaction(id: number): void {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      this.transactionService.deleteTransaction(id);
    }
  }

  /** Calcula indicadores financeiros com base nas transações atuais. */
  private calculateKPIs(): void {
    // 10. Usar getTransactions() aqui está correto, pois queremos o snapshot atual
    const txs = this.transactionService.getTransactions();
    let income = 0;
    let expense = 0;
    let incomeCnt = 0;
    let expenseCnt = 0;
    txs.forEach(tx => {
      if (tx.type === 'Receita') {
        income += tx.amount;
        incomeCnt++;
      } else {
        expense += tx.amount;
        expenseCnt++;
      }
    });
    this.totalIncome = income;
    this.totalExpense = expense;
    this.incomeCount = incomeCnt;
    this.expenseCount = expenseCnt;
    this.balance = income - expense;

    // Lógica do Limite MEI (RF005)
    this.meiLimitProgress = Math.min(100, (this.totalIncome / this.MEI_LIMIT) * 100);
  }

  /** Retorna a classe CSS para a barra de progresso do limite MEI. */
  getMeiProgressClass(): string {
    if (this.meiLimitProgress < 50) {
      return 'progress-green';
    } else if (this.meiLimitProgress < 80) {
      return 'progress-yellow';
    } else {
      return 'progress-red';
    }
  }

  /** Desenha ou atualiza o gráfico utilizando Chart.js. */
  private drawChart(): void {
    // Aguarda o Chart.js estar carregado (pode não existir em ambientes de teste)
    if (typeof Chart === 'undefined') {
      return;
    }
    const canvas = document.getElementById('lineChartCanvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    // Destroy the previous chart instance if exists to avoid duplicates
    if (this.chart) {
      this.chart.destroy();
    }
    // 11. Usar getTransactions() aqui também está correto
    const txs = this.transactionService.getTransactions();
    // Ordenamos por data para melhorar a apresentação
    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
    // Agregamos por data (dia) somando receitas e despesas
    const labels: string[] = [];
    const incomeData: number[] = [];
    const expenseData: number[] = [];
    const map = new Map<string, { income: number; expense: number }>();
    for (const tx of sorted) {
      const key = tx.date;
      if (!map.has(key)) map.set(key, { income: 0, expense: 0 });
      const entry = map.get(key)!;
      if (tx.type === 'Receita') entry.income += tx.amount;
      else entry.expense += tx.amount;
    }
    for (const [date, values] of map.entries()) {
      labels.push(date);
      incomeData.push(values.income);
      expenseData.push(values.expense);
    }
    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Receitas',
            data: incomeData,
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            tension: 0.4
          },
          {
            label: 'Despesas',
            data: expenseData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom' as const
          }
        }
      }
    });
  }
}