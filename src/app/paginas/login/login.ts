import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/interceptores';

@Component({
  selector: 'df-login',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  cargando = signal(false);
  error = signal<string | null>(null);
  form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  async entrar() {
    if (this.form.invalid) return;
    this.cargando.set(true);
    this.error.set(null);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email, password);
      this.router.navigate(['/dashboard']);
    } catch (e) {
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }
}
