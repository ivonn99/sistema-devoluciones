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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="clientes-plantilla-container">
      {/* Header */}
      <div className="header">
        <div>
          <h1>Clientes Plantilla</h1>
          <p className="subtitle">Carga masiva de clientes desde archivo CSV o TSV</p>
        </div>
        <button className="btn-download-template" onClick={downloadTemplate}>
          <Download size={18} />
          Descargar Plantilla CSV
        </button>
      </div>

      {/* Upload Zone */}
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.txt"
          onChange={(e) => handleFileUpload(e.target.files[0])}
          style={{ display: 'none' }}
        />

        <FileSpreadsheet size={48} className="upload-icon" />
        <h3>Arrastra tu archivo CSV o TSV aquí</h3>
        <p>o haz clic para seleccionar un archivo</p>
        <small>El archivo debe contener las columnas: nombre, ruta_reparto</small>
      </div>

      {/* Progress */}
      {loading && (
        <div className="progress-section">
          <div className="spinner"></div>
          <p>Procesando archivo...</p>
          {uploadProgress !== null && (
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          )}
        </div>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <div className="result-section">
          <div className="result-card success">
            <CheckCircle size={24} />
            <div>
              <h3>¡Carga completada exitosamente!</h3>
              <div className="result-stats">
                <div className="stat">
                  <span className="stat-label">Total procesados:</span>
                  <span className="stat-value">{uploadResult.total}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Nuevos insertados:</span>
                  <span className="stat-value green">{uploadResult.insertados}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Actualizados:</span>
                  <span className="stat-value blue">{uploadResult.actualizados}</span>
                </div>
                {uploadResult.errores > 0 && (
                  <div className="stat">
                    <span className="stat-label">Errores:</span>
                    <span className="stat-value red">{uploadResult.errores}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="result-section">
          <div className="result-card error">
            <XCircle size={24} />
            <div>
              <h3>Error al procesar archivo</h3>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="info-box">
        <AlertTriangle size={20} />
        <div>
          <strong>Importante:</strong>
          <ul>
            <li>Si el cliente YA existe (mismo nombre), se actualizará su ruta de reparto</li>
            <li>Si el cliente NO existe, se insertará como nuevo registro</li>
            <li>El archivo debe tener las columnas: <code>nombre</code>, <code>ruta_reparto</code></li>
            <li>Soporta archivos CSV (separados por comas o punto y coma) y TSV (separados por tabuladores)</li>
          </ul>
        </div>
      </div>

      {/* Tabla de ejemplo del formato */}
      <div className="clientes-section">
        <h2>Ejemplo de formato</h2>
        <p className="ejemplo-descripcion">
          Tu archivo CSV o TSV debe tener este formato. La primera fila debe contener los nombres de las columnas.
        </p>
        <div className="tabla-wrapper">
          <table className="tabla-clientes">
            <thead>
              <tr>
                <th>nombre</th>
                <th>ruta_reparto</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="ejemplo-cell">Cliente Ejemplo 1</td>
                <td className="ejemplo-cell">Ruta A</td>
              </tr>
              <tr>
                <td className="ejemplo-cell">Cliente Ejemplo 2</td>
                <td className="ejemplo-cell">Ruta B</td>
              </tr>
              <tr>
                <td className="ejemplo-cell">Cliente Ejemplo 3</td>
                <td className="ejemplo-cell">Ruta C</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientesPlantilla;
