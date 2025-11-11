import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * Serviço responsável por inicializar e expor uma instância única do
 * cliente Supabase. Ao centralizar a criação do cliente aqui, evitamos
 * duplicar código em vários serviços e podemos futuramente estender
 * funcionalidades (como interceptação de erros ou logging) em um só
 * lugar. O SupabaseClient é usado para autenticação, leitura e
 * escrita no banco de dados.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  /** Instância privada do cliente Supabase. */
  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );
  }

  /** Retorna a instância do cliente Supabase. */
  get client(): SupabaseClient {
    return this.supabase;
  }
}