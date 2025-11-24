import { useState } from 'react';
import { Save, Lock, Eye, EyeOff } from 'lucide-react';
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
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose} tabIndex="-1">
      <div className="modal-dialog modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header bg-warning text-dark">
            <div className="d-flex align-items-center gap-2">
              <Lock size={24} />
              <div>
                <h2 className="modal-title mb-0 h4 fw-bold">Cambiar Contraseña</h2>
                <p className="mb-0 small">Usuario: <strong>{usuario.username}</strong></p>
              </div>
            </div>
            <button className="btn-close" onClick={onClose} type="button"></button>
          </div>

          <form onSubmit={handleSubmit} className="modal-body">
            {/* Nueva Contraseña */}
            <div className="mb-3">
              <label className="form-label fw-semibold d-flex align-items-center gap-2">
                <Lock size={18} />
                Nueva Contraseña *
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Ingrese la nueva contraseña"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>

            {/* Confirmar Contraseña */}
            <div className="mb-3">
              <label className="form-label fw-semibold d-flex align-items-center gap-2">
                <Lock size={18} />
                Confirmar Contraseña *
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Confirme la nueva contraseña"
                  className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
            </div>

            {/* Requisitos de contraseña */}
            <div className="alert alert-info">
              <p className="mb-2 fw-semibold">Requisitos:</p>
              <ul className="mb-0 small">
                <li className={formData.password.length >= 6 ? 'text-success' : ''}>
                  {formData.password.length >= 6 ? '✓' : '○'} Mínimo 6 caracteres
                </li>
                <li className={formData.password === formData.confirmPassword && formData.password ? 'text-success' : ''}>
                  {formData.password === formData.confirmPassword && formData.password ? '✓' : '○'} Las contraseñas coinciden
                </li>
              </ul>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-warning d-flex align-items-center gap-2" disabled={loading}>
                <Save size={18} />
                {loading ? 'Guardando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CambiarPasswordModal;
