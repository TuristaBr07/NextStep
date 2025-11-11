import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { CategoryService } from '../../services/category';
import { Category } from '../../models/category';
import { SupabaseService } from '../../services/supabase.service';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth'; // <-- 1. IMPORTAR AuthService

/**
 * Página de configurações. Aqui o usuário pode gerenciar suas
 * categorias e atualizar algumas informações de perfil armazenadas
 * na tabela `profiles` do Supabase.
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf, RouterLink, FormsModule],
  templateUrl: './settings.html'
})
export class Settings implements OnInit {
  /** Observable das categorias cadastradas. */
  public categories$!: Observable<Category[]>;
  /** Modelo para o formulário de nova categoria. */
  newCategory: Partial<Category> = { name: '', type: 'Receita' };
  /** Categoria que está sendo editada. */
  editingCategory: Category | null = null;
  /** Perfil do usuário. */
  profile: { full_name?: string; company_name?: string } = {};

  constructor(
    private categoryService: CategoryService,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private authService: AuthService // <-- 2. INJETAR AuthService
  ) {
    // Inicializa o stream de categorias após a injeção de dependências
    this.categories$ = this.categoryService.categories$;
    // O CategoryService já invoca fetchCategories() no seu construtor para
    // carregar os dados do usuário logado. Não é necessário chamar
    // fetchCategories() novamente aqui; isso evita chamadas duplicadas.
    // this.categoryService.fetchCategories(); // Removido conforme instrução
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  /** Carrega os dados do perfil para os campos de edição. */
  private async loadProfile(): Promise<void> {
    const { data: sessionData } = await this.supabaseService.client.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) return;
    const { data, error } = await this.supabaseService.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('Erro ao carregar perfil:', error.message);
      this.notificationService.error('Erro ao carregar perfil: ' + error.message);
      return;
    }
    this.profile.full_name = data?.full_name ?? '';
    this.profile.company_name = data?.company_name ?? '';
  }

  /** Salva ou atualiza a categoria informada. */
  async saveCategory(): Promise<void> {
    if (!this.newCategory.name || !this.newCategory.type) {
      this.notificationService.error('Informe nome e tipo da categoria.');
      return;
    }

    try {
      if (this.editingCategory) {
        // Atualiza
        await this.categoryService.updateCategory(this.editingCategory.id, {
          name: this.newCategory.name!,
          type: this.newCategory.type as 'Receita' | 'Despesa'
        });
        this.notificationService.success('Categoria atualizada com sucesso!');
      } else {
        // Adiciona
        await this.categoryService.addCategory({
          name: this.newCategory.name!,
          type: this.newCategory.type as 'Receita' | 'Despesa'
        });
        this.notificationService.success('Categoria adicionada com sucesso!');
      }
      this.resetCategoryForm();
    } catch (error: any) {
      this.notificationService.error('Erro ao salvar categoria: ' + error.message);
    }
  }

  /** Prepara o formulário para edição. */
  editCategory(cat: Category): void {
    this.editingCategory = cat;
    this.newCategory = { ...cat };
  }

  /** Reseta o formulário de categoria. */
  resetCategoryForm(): void {
    this.editingCategory = null;
    this.newCategory = { name: '', type: 'Receita' };
  }

  /** Remove uma categoria existente. */
  async removeCategory(cat: Category): Promise<void> {
    if (confirm(`Deseja excluir a categoria "${cat.name}"?`)) {
      try {
        await this.categoryService.deleteCategory(cat.id);
        this.notificationService.success(`Categoria "${cat.name}" excluída com sucesso!`);
      } catch (error: any) {
        this.notificationService.error('Erro ao excluir categoria: ' + error.message);
      }
    }
  }

  /** Atualiza o perfil do usuário na tabela `profiles`. */
  async saveProfile(): Promise<void> {
    const { data: sessionData } = await this.supabaseService.client.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) return;
    const updates = {
      id: userId,
      full_name: this.profile.full_name,
      company_name: this.profile.company_name
    };
    const { error } = await this.supabaseService.client
      .from('profiles')
      .upsert(updates, { onConflict: 'id' });
    if (error) {
      console.error('Erro ao atualizar perfil:', error.message);
      this.notificationService.error('Erro ao atualizar perfil: ' + error.message);
    } else {
      this.notificationService.success('Perfil atualizado com sucesso!');
    }
  }

  /** Realiza logout via serviço de autenticação. */
  fazerLogout(): void { // <-- 3. ADICIONE ESTE MÉTODO
    this.authService.logout();
  }
}