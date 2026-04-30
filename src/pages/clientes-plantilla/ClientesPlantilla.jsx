import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';
import Swal from 'sweetalert2';
import useClientesPlantillaStore from '../../stores/clientesPlantillaStore';
import './ClientesPlantilla.css';

const ClientesPlantilla = () => {
  const {
    loading,
    error,
    uploadProgress,
    upsertClientesMasivo,
    clearError,
    clearProgress
  } = useClientesPlantillaStore();

  const [isDragging, setIsDragging] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  // Parsear archivo CSV/TSV respetando comillas y detectando delimitador
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());

    // Detectar delimitador automáticamente (tabulador, coma o punto y coma)
    const detectDelimiter = (line) => {
      // Contar tabuladores, comas y punto y comas fuera de comillas
      let tabs = 0;
      let commas = 0;
      let semicolons = 0;
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        if (!inQuotes) {
          if (char === '\t') tabs++;
          if (char === ',') commas++;
          if (char === ';') semicolons++;
        }
      }

      // Retornar el que tenga más ocurrencias (prioridad: tab > semicolon > comma)
      if (tabs > 0) return '\t';
      return semicolons > commas ? ';' : ',';
    };

    const delimiter = detectDelimiter(lines[0]);

    // Función auxiliar para parsear una línea CSV respetando comillas
    const parseCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Comilla doble escapada
            current += '"';
            i++; // Skip next quote
          } else {
            // Toggle estado de comillas
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          // Delimitador de columna (solo si no estamos dentro de comillas)
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }

      // Agregar último valor
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());

    // Validar que tenga las columnas necesarias
    if (!headers.includes('nombre') || !headers.includes('ruta_reparto')) {
      throw new Error('El archivo debe contener las columnas: nombre, ruta_reparto');
    }

    const nombreIndex = headers.indexOf('nombre');
    const rutaIndex = headers.indexOf('ruta_reparto');

    const clientes = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);

      if (values[nombreIndex]) {
        clientes.push({
          nombre: values[nombreIndex],
          ruta_reparto: values[rutaIndex] || ''
        });
      }
    }

    return clientes;
  };

  // Manejar archivo seleccionado
  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validar tipo de archivo
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.tsv') && !file.name.endsWith('.txt')) {
      Swal.fire({
        icon: 'warning',
        title: 'Archivo inválido',
        text: 'Por favor selecciona un archivo CSV o TSV',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    clearError();
    clearProgress();
    setUploadResult(null);

    try {
      // Leer el archivo
      const text = await file.text();
      const clientesData = parseCSV(text);

      if (clientesData.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Archivo vacío',
          text: 'El archivo no contiene datos válidos',
          confirmButtonColor: '#3085d6'
        });
        return;
      }

      // Eliminar duplicados: mantener solo el último registro de cada nombre
      const clientesUnicos = {};
      clientesData.forEach(cliente => {
        clientesUnicos[cliente.nombre] = cliente;
      });
      const clientesDataLimpio = Object.values(clientesUnicos);

      // Mostrar información si se encontraron duplicados
      const duplicadosEncontrados = clientesData.length - clientesDataLimpio.length;
      if (duplicadosEncontrados > 0) {
        await Swal.fire({
          icon: 'info',
          title: 'Duplicados detectados',
          text: `Se encontraron ${duplicadosEncontrados} registro(s) duplicado(s) en el CSV. Se procesará solo el último registro de cada cliente.`,
          confirmButtonColor: '#3085d6'
        });
      }

      // Subir a Supabase
      const result = await upsertClientesMasivo(clientesDataLimpio);

      if (result.success) {
        setUploadResult(result.stats);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.error,
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error al procesar archivo',
        text: err.message,
        confirmButtonColor: '#dc3545'
      });
    }
  };

  // Drag & Drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  // Click en zona de drop
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Descargar plantilla CSV de ejemplo
  const downloadTemplate = () => {
    const csvContent = 'nombre;ruta_reparto\nCliente Ejemplo 1;Ruta A\nCliente Ejemplo 2;Ruta B\n"AIECSA, S.A. DE C.V";Ruta C';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_clientes.csv';

    // Disparar descarga sin insertar/eliminar nodos del DOM
    try {
      a.click();
    } finally {
      // Liberar el objeto URL para evitar fugas de memoria
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="card border-primary mb-4 shadow-sm">
        <div className="card-header bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h1 className="h3 mb-1 fw-bold">Clientes Plantilla</h1>
              <p className="mb-0 opacity-75">Carga masiva de clientes desde archivo CSV o TSV</p>
            </div>
            <button className="btn btn-light d-flex align-items-center gap-2" onClick={downloadTemplate}>
              <Download size={18} />
              Descargar Plantilla CSV
            </button>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="card mb-4">
        <div className="card-body">
          <div
            className={`border rounded p-5 text-center ${isDragging ? 'border-primary bg-light' : 'border-dashed'} hover-lift upload-zone`}
            style={{ 
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            data-dragging={isDragging}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={(e) => handleFileUpload(e.target.files[0])}
              style={{ display: 'none' }}
            />

            <FileSpreadsheet size={64} className={`mb-3 ${isDragging ? 'text-primary' : 'text-muted'}`} />
            <h4 className="mb-2">Arrastra tu archivo CSV o TSV aquí</h4>
            <p className="text-muted mb-2">o haz clic para seleccionar un archivo</p>
            <small className="text-muted">El archivo debe contener las columnas: <strong>nombre</strong>, <strong>ruta_reparto</strong></small>
          </div>
        </div>
      </div>

      {/* Progress */}
      {loading && (
        <div className="card mb-4">
          <div className="card-body text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mb-2">Procesando archivo...</p>
            {uploadProgress !== null && (
              <div className="progress" style={{ height: '1.5rem' }}>
                <div 
                  className="progress-bar progress-bar-striped progress-bar-animated" 
                  role="progressbar" 
                  style={{ width: `${uploadProgress}%` }}
                  aria-valuenow={uploadProgress} 
                  aria-valuemin="0" 
                  aria-valuemax="100"
                >
                  {uploadProgress}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <div className="card border-success mb-4">
          <div className="card-body">
            <div className="d-flex align-items-start gap-3">
              <CheckCircle size={32} className="text-success flex-shrink-0" />
              <div className="flex-grow-1">
                <h5 className="text-success mb-3">¡Carga completada exitosamente!</h5>
                <div className="row g-3">
                  <div className="col-md-6 col-lg-3">
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        <div className="h4 mb-0 fw-bold">{uploadResult.total}</div>
                        <small className="text-muted">Total procesados</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="card bg-success bg-opacity-10 border-success">
                      <div className="card-body text-center">
                        <div className="h4 mb-0 fw-bold text-success">{uploadResult.insertados}</div>
                        <small className="text-muted">Nuevos insertados</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="card bg-info bg-opacity-10 border-info">
                      <div className="card-body text-center">
                        <div className="h4 mb-0 fw-bold text-info">{uploadResult.actualizados}</div>
                        <small className="text-muted">Actualizados</small>
                      </div>
                    </div>
                  </div>
                  {uploadResult.errores > 0 && (
                    <div className="col-md-6 col-lg-3">
                      <div className="card bg-danger bg-opacity-10 border-danger">
                        <div className="card-body text-center">
                          <div className="h4 mb-0 fw-bold text-danger">{uploadResult.errores}</div>
                          <small className="text-muted">Errores</small>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert alert-danger d-flex align-items-start gap-3 mb-4">
          <XCircle size={24} className="flex-shrink-0" />
          <div>
            <h5 className="alert-heading mb-2">Error al procesar archivo</h5>
            <p className="mb-0">{error}</p>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="alert alert-info d-flex align-items-start gap-3 mb-4">
        <AlertTriangle size={24} className="flex-shrink-0" />
        <div>
          <strong>Importante:</strong>
          <ul className="mb-0 mt-2">
            <li>Si el cliente YA existe (mismo nombre), se actualizará su ruta de reparto</li>
            <li>Si el cliente NO existe, se insertará como nuevo registro</li>
            <li>El archivo debe tener las columnas: <code>nombre</code>, <code>ruta_reparto</code></li>
            <li>Soporta archivos CSV (separados por comas o punto y coma) y TSV (separados por tabuladores)</li>
          </ul>
        </div>
      </div>

      {/* Tabla de ejemplo del formato */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Ejemplo de formato</h5>
        </div>
        <div className="card-body">
          <p className="text-muted mb-3">
            Tu archivo CSV o TSV debe tener este formato. La primera fila debe contener los nombres de las columnas.
          </p>
          <div className="table-responsive">
            <table className="table table-bordered table-sm">
              <thead className="table-light">
                <tr>
                  <th>nombre</th>
                  <th>ruta_reparto</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Cliente Ejemplo 1</td>
                  <td>Ruta A</td>
                </tr>
                <tr>
                  <td>Cliente Ejemplo 2</td>
                  <td>Ruta B</td>
                </tr>
                <tr>
                  <td>Cliente Ejemplo 3</td>
                  <td>Ruta C</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientesPlantilla;
