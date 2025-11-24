import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import useAuthStore from "../../stores/authStore";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, user, loading, error, clearError } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Si ya hay un usuario autenticado, redirigir
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Limpiar error cuando el componente se monta
  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
   
    const result = await signIn(username, password);
   
    if (result.success) {
      navigate("/dashboard", { replace: true });
    } else {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <form onSubmit={handleSubmit} className="login-form">
          <div className="text-center mb-4">
            <div className="login-logo"></div>
            <h1 className="h3 fw-bold text-white">Iniciar Sesión</h1>
            <div className="login-divider"></div>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <span className="me-2">⚠️</span>
              <div>{error}</div>
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="username" className="form-label text-white-50 text-uppercase fw-semibold small">
              Usuario
            </label>
            <input
              type="text"
              className="form-control form-control-lg"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="username"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label text-white-50 text-uppercase fw-semibold small">
              Contraseña
            </label>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control form-control-lg"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={togglePasswordVisibility}
                disabled={isSubmitting}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-success btn-lg w-100 fw-semibold text-uppercase"
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Iniciando sesión...
              </>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;