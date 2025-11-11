export interface Transaction {
  /**
   * Identificador único da transação. Este campo é gerado
   * automaticamente pelo serviço e utilizado para buscar
   * e atualizar uma transação específica.
   */
  id: number;

  /**
   * Data da transação no formato ISO (yyyy‑MM‑dd). Usamos string ao
   * invés de Date para facilitar a serialização no localStorage.
   */
  date: string;

  /**
   * Tipo da transação. "Receita" representa entrada de dinheiro e
   * "Despesa" representa saída.
   */
  type: 'Receita' | 'Despesa';

  /**
   * Categoria da transação. Pode ser qualquer valor definido no
   * cadastro de categorias ou livremente informado pelo usuário.
   */
  category: string;

  /**
   * Descrição livre fornecida pelo usuário explicando a transação.
   */
  description: string;

  /**
   * Valor monetário da transação. Valores positivos devem ser
   * utilizados tanto para receitas quanto despesas; o tipo define se
   * será somado ou subtraído no saldo.
   */
  amount: number;

  /**
   * Identificador do usuário ao qual esta transação pertence. Este
   * campo é adicionado para refletir o relacionamento com a tabela
   * de usuários no banco de dados. O atributo é opcional porque
   * transações criadas no cliente antes de serem persistidas ainda
   * não possuem um `user_id` definido.
   */
  user_id?: string;
}