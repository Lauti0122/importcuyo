"use client";

import { Eye, EyeOff } from "lucide-react";
import { useActionState, useState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(login, null);
  const [visible, setVisible] = useState(false);
  return (
    <form action={action} className="login-form">
      <label className="field">
        <span className="field-label">Email</span>
        <input type="email" name="email" autoComplete="username" autoFocus required />
      </label>
      <label className="field">
        <span className="field-label">Contraseña</span>
        <span className="password-field">
          <input type={visible ? "text" : "password"} name="password" autoComplete="current-password" required />
          <button type="button" className="icon-btn" onClick={() => setVisible(!visible)} aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}>
            {visible ? <EyeOff /> : <Eye />}
          </button>
        </span>
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="a-btn is-primary" disabled={pending}>
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
