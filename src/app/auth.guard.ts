import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './services/auth';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Este é um "Guarda de Rota" funcional, estilo moderno. Agora ele suporta
// verificação assíncrona utilizando a API de autenticação do Supabase.
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  // Convertemos a Promise em Observable e mapeamos para boolean ou UrlTree
  return from(authService.isLoggedIn()).pipe(
    map((loggedIn: boolean): boolean | UrlTree => {
      return loggedIn ? true : router.parseUrl('/login');
    })
  );
};
