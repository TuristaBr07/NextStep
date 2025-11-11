/**
 * Ambiente de configuração da aplicação. Aqui colocamos as variáveis
 * necessárias para inicializar serviços de terceiros como o Supabase.
 *
 * **Atenção:** substitua os valores de `supabaseUrl` e `supabaseAnonKey`
 * pelas chaves fornecidas ao criar o projeto no Supabase. Estas chaves
 * não devem ser versionadas com valores reais em repositórios públicos.
 */
export const environment = {
  production: false,
  // URL base do seu projeto Supabase. Exemplo: 'https://xyzcompany.supabase.co'
  supabaseUrl: 'MUDAR PARA .ENV', // TESTE SOMENTE LOCAL
  // Chave anônima de acesso ao Supabase. Exemplo: 'public-anon-key'
  supabaseAnonKey: 'MUDAR PARA .ENV' // TESTE SOMENTE LOCAL
};
