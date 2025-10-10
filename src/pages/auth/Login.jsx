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
      <form onSubmit={handleSubmit} className="login-form">
        <h1>Iniciar Sesión</h1>
       
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
       
        <div className="form-group">
          <label>Usuario</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isSubmitting}
            autoComplete="username"
          />
        </div>
       
        <div className="form-group">
          <label>Contraseña</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle-btn"
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
          disabled={isSubmitting || loading}
        >
          {isSubmitting || loading ? "Iniciando sesión..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
};

export default Login;