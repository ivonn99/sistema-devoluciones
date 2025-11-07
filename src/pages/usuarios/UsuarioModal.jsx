import { useState, useEffect } from 'react';
import { X, Save, User, Lock, Shield, UserCircle } from 'lucide-react';
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <User size={24} />
            <h2>{usuario ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Username */}
          <div className="form-group">
            <label>
              <UserCircle size={18} />
              Usuario *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder="Ingrese el nombre de usuario"
              className={errors.username ? 'error' : ''}
              disabled={!!usuario} // No permitir cambiar username al editar
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          {/* Nombre Completo */}
          <div className="form-group">
            <label>
              <User size={18} />
              Nombre Completo *
            </label>
            <input
              type="text"
              value={formData.nombre_completo}
              onChange={(e) => handleChange('nombre_completo', e.target.value)}
              placeholder="Ingrese el nombre completo"
              className={errors.nombre_completo ? 'error' : ''}
            />
            {errors.nombre_completo && <span className="error-message">{errors.nombre_completo}</span>}
          </div>

          {/* Rol */}
          <div className="form-group">
            <label>
              <Shield size={18} />
              Rol *
            </label>
            <select
              value={formData.rol_id}
              onChange={(e) => handleChange('rol_id', e.target.value)}
              className={errors.rol_id ? 'error' : ''}
            >
              <option value="">Seleccione un rol</option>
              {roles.map(rol => (
                <option key={rol.id} value={rol.id}>
                  {rol.name}
                </option>
              ))}
            </select>
            {errors.rol_id && <span className="error-message">{errors.rol_id}</span>}
          </div>

          {/* Contraseña - Solo para nuevos usuarios */}
          {!usuario && (
            <>
              <div className="form-group">
                <label>
                  <Lock size={18} />
                  Contraseña *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Ingrese la contraseña"
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              {/* Mostrar contraseña */}
              <div className="form-group-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                  />
                  Mostrar contraseña
                </label>
              </div>
            </>
          )}

          {/* Nota para usuarios existentes */}
          {usuario && (
            <div className="info-box">
              <Lock size={18} />
              <p>Para cambiar la contraseña, use el botón "Cambiar Contraseña" en la tabla de usuarios.</p>
            </div>
          )}

          {/* Estado */}
          <div className="form-group-checkbox">
            <label>
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={(e) => handleChange('activo', e.target.checked)}
              />
              Usuario activo
            </label>
          </div>

          {/* Botones */}
          <div className="modal-footer">
            <button type="button" className="btn-cancelar" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-guardar" disabled={loading}>
              <Save size={18} />
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsuarioModal;
