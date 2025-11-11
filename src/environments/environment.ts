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
  supabaseUrl: 'https://wsnrotqjekgelowseqet.supabase.co',
  // Chave anônima de acesso ao Supabase. Exemplo: 'public-anon-key'
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzbnJvdHFqZWtnZWxvd3NlcWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNDQzOTIsImV4cCI6MjA3NzcyMDM5Mn0.6lFmXwZCHiruXkOpBEE24z6k5caxyNpbLMUWJWS1aXE'
};