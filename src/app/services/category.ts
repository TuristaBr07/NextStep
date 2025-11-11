import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Category } from '../models/category';
import { SupabaseService } from './supabase.service';

/**
 * Serviço de categorias. Este serviço encapsula toda a lógica de
 * leitura e escrita de categorias no banco de dados Supabase. Ele
 * mantém um BehaviorSubject para que a interface possa reagir
 * automaticamente às mudanças sem a necessidade de polling.
 */
@Injectable({ providedIn: 'root' })
export class CategoryService {
  /** Fluxo reativo das categorias. */
  private readonly categoriesSubject = new BehaviorSubject<Category[]>([]);
  /** Exposição pública do observable. */
  public readonly categories$: Observable<Category[]> = this.categoriesSubject.asObservable();

  constructor(private supabaseService: SupabaseService) {
    // Ao instanciar o serviço, buscamos imediatamente as categorias
    this.fetchCategories().catch(err => console.error('Erro inicial ao buscar categorias:', err));
  }

  /**
   * Busca todas as categorias do usuário logado. Utiliza o serviço de
   * autenticação do Supabase para obter o id do usuário. Caso não
   * exista usuário logado, o resultado será uma lista vazia.
   */
  async fetchCategories(): Promise<void> {
    try {
      // Recupera a sessão atual para obter o id do usuário
      const { data: sessionData } = await this.supabaseService.client.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        this.categoriesSubject.next([]);
        return;
      }
      const { data, error } = await this.supabaseService.client
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });
      if (error) {
        console.error('Erro ao carregar categorias:', error.message);
        this.categoriesSubject.next([]);
        return;
      }
      // Forçamos os tipos para Category. O Supabase retorna strings
      // para todos os campos, portanto é seguro fazer cast aqui.
      this.categoriesSubject.next((data ?? []) as unknown as Category[]);
    } catch (err) {
      console.error('Falha ao buscar categorias:', err);
      this.categoriesSubject.next([]);
    }
  }

  /**
   * Adiciona uma nova categoria para o usuário logado. Após a
   * inserção, recarrega a lista de categorias.
   */
  async addCategory(cat: Omit<Category, 'id'>): Promise<void> {
    try {
      const { data: sessionData } = await this.supabaseService.client.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }
      const { error } = await this.supabaseService.client
        .from('categories')
        .insert([{ ...cat, user_id: userId }]);
      if (error) {
        console.error('Erro ao inserir categoria:', error.message);
        return;
      }
      await this.fetchCategories();
    } catch (err) {
      console.error('Falha ao adicionar categoria:', err);
    }
  }

  /**
   * Atualiza uma categoria existente. O método recebe apenas os
   * campos que podem ser modificados (nome e tipo). Após a
   * atualização, recarrega a lista de categorias.
   */
  async updateCategory(id: number, partial: Partial<Omit<Category, 'id'>>): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from('categories')
        .update(partial)
        .eq('id', id);
      if (error) {
        console.error('Erro ao atualizar categoria:', error.message);
        return;
      }
      await this.fetchCategories();
    } catch (err) {
      console.error('Falha ao atualizar categoria:', err);
    }
  }

  /**
   * Remove uma categoria pelo seu id. Após a exclusão, recarrega a
   * lista de categorias.
   */
  async deleteCategory(id: number): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('Erro ao excluir categoria:', error.message);
        return;
      }
      await this.fetchCategories();
    } catch (err) {
      console.error('Falha ao excluir categoria:', err);
    }
  }
}