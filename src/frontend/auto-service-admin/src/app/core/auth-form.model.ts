import {
  FieldErrors,
  requireEmail,
  requireMinLength,
  requirePattern,
  requireText
} from './form-validation';

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  tenantName: string;
  slug: string;
  fullName: string;
  email: string;
  password: string;
}

const SLUG_RE = /^[a-z0-9-]+$/;

export function validateLoginForm(form: LoginForm): FieldErrors {
  const errors: FieldErrors = {};
  requireEmail(errors, 'email', form.email);
  if (!form.password) {
    errors['password'] = 'Укажите пароль';
  }
  return errors;
}

export function validateRegisterForm(form: RegisterForm): FieldErrors {
  const errors: FieldErrors = {};
  requireText(errors, 'tenantName', form.tenantName, 'Название сервиса', 200);
  requirePattern(
    errors,
    'slug',
    form.slug.toLowerCase().trim(),
    SLUG_RE,
    'Slug: только латиница, цифры и дефис (a-z, 0-9, -)',
    100
  );
  requireText(errors, 'fullName', form.fullName, 'Ваше имя', 200);
  requireEmail(errors, 'email', form.email);
  if (!form.password.trim()) {
    errors['password'] = 'Укажите пароль';
  } else {
    requireMinLength(errors, 'password', form.password, 6, 'Пароль');
  }
  return errors;
}
