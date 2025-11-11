/**
 * Representa uma categoria de transação. As categorias ajudam o
 * empreendedor a agrupar receitas e despesas de acordo com sua origem
 * ou finalidade. É possível ter categorias específicas para receitas
 * (por exemplo, "Venda de Produto", "Prestação de Serviço") e
 * despesas (por exemplo, "Fornecedores", "Água/Luz/Internet").
 */
export interface Category {
  /** Identificador único da categoria */
  id: number;
  /** Nome visível da categoria */
  name: string;
  /** Tipo de transação associado à categoria */
  type: 'Receita' | 'Despesa';

  /**
   * Identificador do usuário ao qual esta categoria pertence.
   * Este campo é preenchido pelo Supabase quando a categoria é
   * criada via CategoryService. O campo é opcional para permitir
   * que o código continue funcionando com objetos criados no lado
   * do cliente antes de serem persistidos no banco de dados.
   */
  user_id?: string;
}