import { useState, useEffect } from 'react';
import { Save, User, Lock, Shield, UserCircle, Eye, EyeOff } from 'lucide-react';
import useUsuariosStore from '../../stores/usuariosStore';

const UsuarioModal = ({ usuario, roles, onClose }) => {
  const { createUsuario, updateUsuario, loading } = useUsuariosStore();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nombre_completo: '',
    rol_id: '',
    activo: true
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (usuario) {
      setFormData({
        username: usuario.username || '',
        password: '',
        nombre_completo: usuario.nombre_completo || '',
        rol_id: usuario.rol_id || '',
        activo: usuario.activo !== undefined ? usuario.activo : true
      });
    }
  }, [usuario]);

  const validateForm = () => {
    const newErrors = {};

    // Validar username
    if (!formData.username.trim()) {
      newErrors.username = 'El usuario es requerido';
    } else if (formData.username.length < 3) {
      newErrors.username = 'El usuario debe tener al menos 3 caracteres';
    }

    // Validar nombre completo
    if (!formData.nombre_completo.trim()) {
      newErrors.nombre_completo = 'El nombre completo es requerido';
    }

    // Validar rol
    if (!formData.rol_id) {
      newErrors.rol_id = 'Debe seleccionar un rol';
    }

    // Validar contraseña solo si es nuevo usuario
    if (!usuario) {
      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const dataToSend = {
      username: formData.username.trim(),
      nombre_completo: formData.nombre_completo.trim(),
      rol_id: parseInt(formData.rol_id),
      activo: formData.activo
    };

    // Solo incluir password si es nuevo usuario
    if (!usuario && formData.password) {
      dataToSend.password = formData.password;
    }

    let result;
    if (usuario) {
      result = await updateUsuario(usuario.id, dataToSend);
    } else {
      result = await createUsuario(dataToSend);
    }

    if (result.success) {
      onClose();
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose} tabIndex="-1">
      <div className="modal-dialog modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h2 className="modal-title d-flex align-items-center gap-2 mb-0 h4 fw-bold">
              <User size={24} />
              {usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <button className="btn-close btn-close-white" onClick={onClose} type="button"></button>
          </div>

          <form onSubmit={handleSubmit} className="modal-body">
            {/* Username */}
            <div className="mb-3">
              <label className="form-label fw-semibold d-flex align-items-center gap-2">
                <UserCircle size={18} />
                Usuario *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="Ingrese el nombre de usuario"
                className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                disabled={!!usuario}
              />
              {errors.username && <div className="invalid-feedback">{errors.username}</div>}
            </div>

            {/* Nombre Completo */}
            <div className="mb-3">
              <label className="form-label fw-semibold d-flex align-items-center gap-2">
                <User size={18} />
                Nombre Completo *
              </label>
              <input
                type="text"
                value={formData.nombre_completo}
                onChange={(e) => handleChange('nombre_completo', e.target.value)}
                placeholder="Ingrese el nombre completo"
                className={`form-control ${errors.nombre_completo ? 'is-invalid' : ''}`}
              />
              {errors.nombre_completo && <div className="invalid-feedback">{errors.nombre_completo}</div>}
            </div>

            {/* Rol */}
            <div className="mb-3">
              <label className="form-label fw-semibold d-flex align-items-center gap-2">
                <Shield size={18} />
                Rol *
              </label>
              <select
                value={formData.rol_id}
                onChange={(e) => handleChange('rol_id', e.target.value)}
                className={`form-select ${errors.rol_id ? 'is-invalid' : ''}`}
              >
                <option value="">Seleccione un rol</option>
                {roles.map(rol => (
                  <option key={rol.id} value={rol.id}>
                    {rol.name}
                  </option>
                ))}
              </select>
              {errors.rol_id && <div className="invalid-feedback">{errors.rol_id}</div>}
            </div>

            {/* Contraseña - Solo para nuevos usuarios */}
            {!usuario && (
              <>
                <div className="mb-3">
                  <label className="form-label fw-semibold d-flex align-items-center gap-2">
                    <Lock size={18} />
                    Contraseña *
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="Ingrese la contraseña"
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
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
              </>
            )}

            {/* Nota para usuarios existentes */}
            {usuario && (
              <div className="alert alert-info d-flex align-items-start gap-2 mb-3">
                <Lock size={18} className="mt-1" />
                <p className="mb-0 small">Para cambiar la contraseña, use el botón "Cambiar Contraseña" en la tabla de usuarios.</p>
              </div>
            )}

            {/* Estado */}
            <div className="mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => handleChange('activo', e.target.checked)}
                  id="activoCheck"
                />
                <label className="form-check-label" htmlFor="activoCheck">
                  Usuario activo
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={loading}>
                <Save size={18} />
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UsuarioModal;
