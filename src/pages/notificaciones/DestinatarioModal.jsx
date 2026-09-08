import { useState, useEffect } from 'react';
import { Save, Mail, User, GitBranch } from 'lucide-react';
import useDestinatariosStore, { PROCESOS_NOTIFICABLES } from '../../stores/destinatariosStore';

const DestinatarioModal = ({ destinatario, procesoInicial, onClose }) => {
  const { createDestinatario, updateDestinatario, loading } = useDestinatariosStore();

  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    proceso: procesoInicial || '',
    activo: true
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (destinatario) {
      setFormData({
        email: destinatario.email || '',
        nombre: destinatario.nombre || '',
        proceso: destinatario.proceso || '',
        activo: destinatario.activo !== undefined ? destinatario.activo : true
      });
    }
  }, [destinatario]);

  const validateForm = () => {
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'El correo es requerido';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'El formato del correo electrónico no es válido';
    }

    if (!formData.proceso) {
      newErrors.proceso = 'Debe seleccionar un proceso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = destinatario
      ? await updateDestinatario(destinatario.id, formData)
      : await createDestinatario(formData);

    if (result.success) {
      onClose();
    } else {
      setErrors({ email: result.error });
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
              <Mail size={24} />
              {destinatario ? 'Editar Destinatario' : 'Nuevo Destinatario'}
            </h2>
            <button className="btn-close btn-close-white" onClick={onClose} type="button"></button>
          </div>

          <form onSubmit={handleSubmit} className="modal-body">
            {/* Correo */}
            <div className="mb-3">
              <label className="form-label fw-semibold d-flex align-items-center gap-2">
                <Mail size={18} />
                Correo Electrónico *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="persona@empresa.com"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                autoFocus
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              <small className="form-text text-muted">
                Puede ser cualquier correo, no necesita ser usuario del sistema
              </small>
            </div>

            {/* Nombre */}
            <div className="mb-3">
              <label className="form-label fw-semibold d-flex align-items-center gap-2">
                <User size={18} />
                Nombre o Referencia
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                placeholder="Ej. Juan Pérez / Contabilidad (opcional)"
                className="form-control"
              />
              <small className="form-text text-muted">
                Solo para identificarlo en esta lista
              </small>
            </div>

            {/* Proceso */}
            <div className="mb-3">
              <label className="form-label fw-semibold d-flex align-items-center gap-2">
                <GitBranch size={18} />
                Proceso *
              </label>
              <select
                value={formData.proceso}
                onChange={(e) => handleChange('proceso', e.target.value)}
                className={`form-select ${errors.proceso ? 'is-invalid' : ''}`}
              >
                <option value="">Seleccione un proceso</option>
                {PROCESOS_NOTIFICABLES.map(proceso => (
                  <option key={proceso.value} value={proceso.value}>
                    {proceso.label}
                  </option>
                ))}
              </select>
              {errors.proceso && <div className="invalid-feedback">{errors.proceso}</div>}
              <small className="form-text text-muted">
                Recibirá un correo cada vez que una devolución pase a este proceso
              </small>
            </div>

            {/* Estado */}
            <div className="mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => handleChange('activo', e.target.checked)}
                  id="destinatarioActivoCheck"
                />
                <label className="form-check-label" htmlFor="destinatarioActivoCheck">
                  Destinatario activo
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

export default DestinatarioModal;
