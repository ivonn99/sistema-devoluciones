import { useState } from 'react';
import { X, Save, Lock, Eye, EyeOff } from 'lucide-react';
import useUsuariosStore from '../../stores/usuariosStore';

const CambiarPasswordModal = ({ usuario, onClose }) => {
  const { cambiarPassword, loading } = useUsuariosStore();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Validar contraseña
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Validar confirmación
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await cambiarPassword(usuario.id, formData.password);

    if (result.success) {
      onClose();
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Lock size={24} />
            <div>
              <h2>Cambiar Contraseña</h2>
              <p className="modal-subtitle">Usuario: <strong>{usuario.username}</strong></p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Nueva Contraseña */}
          <div className="form-group">
            <label>
              <Lock size={18} />
              Nueva Contraseña *
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Ingrese la nueva contraseña"
                className={errors.password ? 'error' : ''}
                autoFocus
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {/* Confirmar Contraseña */}
          <div className="form-group">
            <label>
              <Lock size={18} />
              Confirmar Contraseña *
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder="Confirme la nueva contraseña"
                className={errors.confirmPassword ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          {/* Requisitos de contraseña */}
          <div className="password-requirements">
            <p><strong>Requisitos:</strong></p>
            <ul>
              <li className={formData.password.length >= 6 ? 'valid' : ''}>
                Mínimo 6 caracteres
              </li>
              <li className={formData.password === formData.confirmPassword && formData.password ? 'valid' : ''}>
                Las contraseñas coinciden
              </li>
            </ul>
          </div>

          {/* Botones */}
          <div className="modal-footer">
            <button type="button" className="btn-cancelar" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-guardar" disabled={loading}>
              <Save size={18} />
              {loading ? 'Guardando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CambiarPasswordModal;
