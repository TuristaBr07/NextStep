import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  // Importamos RouterLink para [routerLink] e AuthService para o @if
  imports: [RouterLink, AsyncPipe],
  templateUrl: './home.html'
})
export class Home {
  // Injetamos o serviço para que o HTML possa verificar se o usuário está logado
  constructor(public authService: AuthService) {}
}