import { Routes } from '@angular/router';
// Importamos os componentes que acabamos de gerar
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Reports } from './pages/reports/reports';
import { Settings } from './pages/settings/settings';
// Novas páginas para cadastro e recuperação de senha
import { Register } from './pages/register/register';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
// Importamos o "Guarda" que criamos
import { authGuard } from './auth.guard';
import { Transactions } from './pages/transactions/transactions';

export const routes: Routes = [
  // URL: (vazia) -> Carrega a Home
  { path: '', component: Home },

  // URL: /login -> Carrega o Login
  { path: 'login', component: Login },

  // URL: /register -> Página de cadastro (aberta)
  { path: 'register', component: Register },

  // URL: /forgot-password -> Recuperação de senha
  { path: 'forgot-password', component: ForgotPassword },

  // URL: /dashboard -> Carrega o Dashboard
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard] // <--- ROTA PROTEGIDA!
  },

  // URL: /reports -> Carrega a página de Relatórios (protegida)
  {
    path: 'reports',
    component: Reports,
    canActivate: [authGuard]
  },

  // URL: /settings -> Carrega a página de Configurações (protegida)
  {
    path: 'settings',
    component: Settings,
    canActivate: [authGuard]
  },
  
  {
    path: 'transactions',
    component: Transactions,
    canActivate: [authGuard]
  },

  // Qualquer outra URL -> Redireciona para a Home
  { path: '**', redirectTo: '' }
];
