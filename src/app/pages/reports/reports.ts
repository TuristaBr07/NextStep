import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { TransactionService } from '../../services/transaction';
import { NotificationService } from '../../services/notification.service';
import { Transaction } from '../../models/transaction';
import { AuthService } from '../../services/auth';
import { Subscription } from 'rxjs'; // <-- 1. IMPORTAR Subscription

// Chart é carregado globalmente via script em index.html
declare const Chart: any;

/**
 * Página de relatórios. Permite filtrar transações por intervalo
 * de datas e exibe um resumo por categoria em tabela e gráfico.
 */
@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, RouterLink, FormsModule],
  templateUrl: './reports.html'
})
export class Reports implements OnInit, OnDestroy {
  /** Data de início do filtro. */
  dateStart = '';
  /** Data de fim do filtro. */
  dateEnd = '';
  /** Tipo de transação a filtrar ('Todos', 'Receita', 'Despesa'). */
  typeFilter: 'Todos' | 'Receita' | 'Despesa' = 'Todos';
  
  /** Lista de TODAS as transações (cache local). */
  private allTransactions: Transaction[] = []; // <-- 2. ADICIONADO
  /** Inscrição para o observable de transações. */
  private transactionsSub?: Subscription; // <-- 3. ADICIONADO

  /** Lista de transações filtradas. */
  filtered: Transaction[] = [];
  /** Referência ao gráfico para destruição. */
  private chart: any;

  public groupedByCategory: { category: string; type: string; total: number; count: number }[] = [];

  constructor(
    private supabaseService: SupabaseService,
    private transactionService: TransactionService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // 4. ALTERADO: Agora assinamos o observable.
    // Quando os dados chegarem do Supabase, eles virão por aqui.
    this.transactionsSub = this.transactionService.transactions$.subscribe(transactions => {
      this.allTransactions = transactions; // Guarda o cache local
      this.filtrar(); // Roda o filtro inicial
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.transactionsSub?.unsubscribe(); // <-- 5. ADICIONADO (Boa prática)
  }

  /**
   * Executa a consulta no Supabase usando o intervalo de datas e
   * popula a lista filtrada. Também recria o gráfico.
   */
  async filtrar(): Promise<void> {
    try {
      // 6. ALTERADO: Agora usamos o cache local 'allTransactions'
      // ao invés de 'this.transactionService.getTransactions()'
      this.filtered = this.allTransactions.filter(tx => {
        const dateMatch =
          (!this.dateStart || tx.date >= this.dateStart) &&
          (!this.dateEnd || tx.date <= this.dateEnd);
        const typeMatch =
          this.typeFilter === 'Todos' || tx.type === this.typeFilter;
        return dateMatch && typeMatch;
      });

      this.groupedByCategory = this.calculateGroupedData();
      this.drawChart();

      // Só mostra notificação se for um filtro manual (não na carga inicial)
      if (this.dateStart || this.dateEnd || this.typeFilter !== 'Todos') {
        this.notificationService.info(`Filtro aplicado. ${this.filtered.length} transação(ões) encontradas.`);
      }
    } catch (err: any) {
      console.error('Falha ao filtrar transações:', err);
      this.notificationService.error('Erro ao aplicar filtro: ' + err.message);
      this.filtered = [];
    }
  }

  /**
   * Agrupa as transações filtradas por categoria retornando um array
   * onde cada elemento contém o nome da categoria, o tipo e o total
   * correspondente. Útil para exibir em tabelas de resumo.
   */
  private calculateGroupedData(): { category: string; type: string; total: number; count: number }[] {
    const map = new Map<string, { type: string; total: number; count: number }>();
    for (const tx of this.filtered) {
      const key = tx.category + '|' + tx.type;
      const entry = map.get(key) ?? { type: tx.type, total: 0, count: 0 };
      entry.total += tx.amount * (tx.type === 'Receita' ? 1 : -1);
      entry.count++;
      map.set(key, entry);
    }
    return Array.from(map.entries()).map(([key, value]) => {
      const [category] = key.split('|');
      return { category, ...value };
    });
  }

  /**
   * Constrói um gráfico de pizza agrupando as transações por
   * categoria. Destrói a instância anterior antes de criar outra.
   */
  private drawChart(): void {
    if (typeof Chart === 'undefined') return;
    const canvas = document.getElementById('pieChartCanvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    // Destruir gráfico existente
    if (this.chart) this.chart.destroy();
    
    const grouped = this.groupedByCategory;
    
    const labels = grouped.map(g => `${g.category} (${g.type})`);
    const data = grouped.map(g => Math.abs(g.total));

    // Definimos paletas de cores
    const receitaColors = ['#22c55e', '#16a34a', '#15803d', '#14532d', '#052e16'];
    const despesaColors = ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'];
    
    let receitaIndex = 0;
    let despesaIndex = 0;

    // Mapeamos os dados e escolhemos a cor com base no TIPO
    const backgroundColors = grouped.map(group => {
      if (group.type === 'Receita') {
        // Pega a próxima cor de receita, ciclando pela lista
        return receitaColors[receitaIndex++ % receitaColors.length];
      } else {
        // Pega a próxima cor de despesa, ciclando pela lista
        return despesaColors[despesaIndex++ % despesaColors.length];
      }
    });

    this.chart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: backgroundColors // Usamos as cores dinâmicas
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  /** Realiza logout via serviço de autenticação. */
  fazerLogout(): void {
    this.authService.logout();
  }
}