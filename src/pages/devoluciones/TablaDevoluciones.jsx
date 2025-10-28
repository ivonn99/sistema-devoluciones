import React, { useState } from "react";
import { Eye, Clock } from "lucide-react";
import useDevolucionesStore from "../../stores/devolucionesStore";
import { supabase } from "../../config/supabase";
import "./TablaDevoluciones.css";

// 🕐 Helper para convertir timestamp UTC a hora CDMX
const convertirAHoraCDMX = (fechaUTC) => {
  if (!fechaUTC) return "-";
  
  const fechaOriginal = new Date(fechaUTC);
  const cdmxDate = new Date(fechaOriginal.getTime() - (6 * 60 * 60 * 1000));
  
  const dia = String(cdmxDate.getUTCDate()).padStart(2, '0');
  const mes = String(cdmxDate.getUTCMonth() + 1).padStart(2, '0');
  const año = cdmxDate.getUTCFullYear();
  const horas = String(cdmxDate.getUTCHours()).padStart(2, '0');
  const minutos = String(cdmxDate.getUTCMinutes()).padStart(2, '0');
  const segundos = String(cdmxDate.getUTCSeconds()).padStart(2, '0');
  
  return `${dia}/${mes}/${año}, ${horas}:${minutos}:${segundos}`;
};

// 🕐 Helper para solo fecha (sin hora)
const convertirSoloFechaCDMX = (fechaUTC) => {
  if (!fechaUTC) return "-";
  
  const fechaOriginal = new Date(fechaUTC);
  const cdmxDate = new Date(fechaOriginal.getTime() - (6 * 60 * 60 * 1000));
  
  const dia = String(cdmxDate.getUTCDate()).padStart(2, '0');
  const mes = String(cdmxDate.getUTCMonth() + 1).padStart(2, '0');
  const año = cdmxDate.getUTCFullYear();
  
  return `${dia}/${mes}/${año}`;
};

const TablaDevoluciones = ({ searchTerm, searchResults, showSearchResults, loading, devolucionesFiltradas, hayFiltrosActivos }) => {
  const { devoluciones } = useDevolucionesStore();
  const [selectedDevolucion, setSelectedDevolucion] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [searchPage, setSearchPage] = useState(1);
  const [searchItemsPerPage, setSearchItemsPerPage] = useState(10);

  // 🔹 Determinar qué datos mostrar
  const dataParaMostrar = hayFiltrosActivos ? devolucionesFiltradas : devoluciones;

  // Paginación para tabla principal (con filtros)
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dataParaMostrar.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(dataParaMostrar.length / itemsPerPage);

  // Paginación para búsqueda
  const searchIndexOfLastItem = searchPage * searchItemsPerPage;
  const searchIndexOfFirstItem = searchIndexOfLastItem - searchItemsPerPage;
  const currentSearchItems = searchResults.slice(searchIndexOfFirstItem, searchIndexOfLastItem);
  const searchTotalPages = Math.ceil(searchResults.length / searchItemsPerPage);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const goToSearchPage = (pageNumber) => {
    setSearchPage(pageNumber);
  };

  const handleSearchItemsPerPageChange = (e) => {
    setSearchItemsPerPage(Number(e.target.value));
    setSearchPage(1);
  };

  const getPageNumbers = (current, total) => {
    const pages = [];
    const maxVisible = 5;

    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      } else if (current >= total - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = total - 3; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(current - 1);
        pages.push(current);
        pages.push(current + 1);
        pages.push('...');
        pages.push(total);
      }
    }
    return pages;
  };

  const abrirDetalles = (devolucion) => {
    console.log("🔍 Abriendo detalles de devolución:", devolucion);
    setSelectedDevolucion(devolucion);
  };

  const cerrarDetalles = () => {
    console.log("❎ Cerrando modal de detalles");
    setSelectedDevolucion(null);
  };

  // Renderizado de tabla
  const renderTabla = (items, esBusqueda = false) => (
    <table className="tabla">
      <thead>
        <tr>
          <th>Número de nota</th> 
          <th>Fecha devolución</th>
          <th>Cliente</th>
          <th>Vendedor</th>
          <th>Empresa</th>
          <th>Tipo cliente</th>
          <th>Motivo</th>
          <th>Días diferencia</th>
          <th>Dentro plazo</th>
          <th>Días transcurridos</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {items.map((dev) => (
          <tr key={dev.id} className={`estado-${dev.estado_actual}`}>
            <td data-label="Número de nota">
              <span className="td-content">{dev.numero_nota || "-"}</span>
            </td>
            <td data-label="Fecha devolución">
              <span className="td-content">{convertirSoloFechaCDMX(dev.fecha_devolucion)}</span>
            </td>
            <td data-label="Cliente">
              <span className="td-content">{dev.cliente}</span>
            </td>
            <td data-label="Vendedor">
              <span className="td-content">{dev.vendedor_nombre || "-"}</span>
            </td>
            <td data-label="Empresa">
              <span className="td-content">{dev.empresa}</span>
            </td>
            <td data-label="Tipo cliente">
              <span className="td-content">{dev.tipo_cliente}</span>
            </td>
            <td data-label="Motivo">
              <span className="td-content">{dev.motivo_devolucion_general}</span>
            </td>
            <td data-label="Días diferencia">
              <span className="td-content">{dev.dias_diferencia ?? "-"}</span>
            </td>
            <td data-label="Dentro plazo">
              <span className="td-content">
                {dev.dentro_plazo === null
                  ? "-"
                  : dev.dentro_plazo
                  ? "✅ Sí"
                  : "❌ No"}
              </span>
            </td>
            <td data-label="Días transcurridos">
              <span className="td-content">{dev.dias_transcurridos ?? "-"}</span>
            </td>
            <td data-label="Estado">
              <span className={`badge-estado ${dev.estado_actual}`}>
                {dev.estado_actual}
              </span>
            </td>
            <td data-label="Acciones">
              <button className="btn-ver" onClick={() => abrirDetalles(dev)}>
                <Eye size={16} color="currentColor" /> Ver
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="tabla-container">
      {/* Resultados de búsqueda */}
      {showSearchResults && (
        <div className="busqueda-resultados">
          <div className="busqueda-header">
            <h3>Resultados de búsqueda ({searchResults.length})</h3>
            {searchResults.length > 0 && (
              <span className="busqueda-termino">Buscando: "{searchTerm}"</span>
            )}
          </div>

          {searchResults.length === 0 ? (
            <p className="busqueda-vacio">
              No se encontraron devoluciones que coincidan con "{searchTerm}"
            </p>
          ) : (
            <>
              <div className="tabla-scroll">
                {renderTabla(currentSearchItems, true)}
              </div>

              {searchTotalPages > 1 && (
                <div className="pagination-container">
                  <div className="pagination-info">
                    Mostrando {searchIndexOfFirstItem + 1} - {Math.min(searchIndexOfLastItem, searchResults.length)} de {searchResults.length} resultados
                  </div>
                  
                  <div className="pagination-controls">
                    <button
                      className="pagination-btn"
                      onClick={() => goToSearchPage(searchPage - 1)}
                      disabled={searchPage === 1}
                    >
                      Anterior
                    </button>

                    {getPageNumbers(searchPage, searchTotalPages).map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                      ) : (
                        <button
                          key={page}
                          className={`pagination-number ${searchPage === page ? 'active' : ''}`}
                          onClick={() => goToSearchPage(page)}
                        >
                          {page}
                        </button>
                      )
                    ))}

                    <button
                      className="pagination-btn"
                      onClick={() => goToSearchPage(searchPage + 1)}
                      disabled={searchPage === searchTotalPages}
                    >
                      Siguiente
                    </button>
                  </div>

                  <div className="pagination-selector">
                    <label>Registros por página:</label>
                    <select value={searchItemsPerPage} onChange={handleSearchItemsPerPageChange}>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tabla principal (solo si no hay búsqueda activa) */}
      {!showSearchResults && (
        <>
          <h2 className="tabla-titulo">
            {hayFiltrosActivos 
              ? `Devoluciones Filtradas (${dataParaMostrar.length})` 
              : 'Todas las Devoluciones'}
          </h2>
          
          {loading ? (
            <p>Cargando devoluciones...</p>
          ) : dataParaMostrar.length === 0 ? (
            <p>
              {hayFiltrosActivos 
                ? 'No hay devoluciones que coincidan con los filtros aplicados.' 
                : 'No hay devoluciones registradas.'}
            </p>
          ) : (
            <>
              <div className="tabla-scroll">
                {renderTabla(currentItems)}
              </div>

              {totalPages > 1 && (
                <div className="pagination-container">
                  <div className="pagination-info">
                    Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, dataParaMostrar.length)} de {dataParaMostrar.length} devoluciones
                  </div>
                  
                  <div className="pagination-controls">
                    <button
                      className="pagination-btn"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </button>

                    {getPageNumbers(currentPage, totalPages).map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                      ) : (
                        <button
                          key={page}
                          className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                          onClick={() => goToPage(page)}
                        >
                          {page}
                        </button>
                      )
                    ))}

                    <button
                      className="pagination-btn"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </button>
                  </div>

                  <div className="pagination-selector">
                    <label>Registros por página:</label>
                    <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {selectedDevolucion && (
        <ModalDetalles devolucion={selectedDevolucion} onClose={cerrarDetalles} />
      )}
    </div>
  );
};

export default TablaDevoluciones;

/* ----------------------------------------- */
/*              Modal Detalles               */
/* ----------------------------------------- */
const ModalDetalles = ({ devolucion, onClose }) => {
  const [seguimiento, setSeguimiento] = useState([]);
  const [loadingSeguimiento, setLoadingSeguimiento] = useState(true);

  React.useEffect(() => {
    const fetchSeguimiento = async () => {
      setLoadingSeguimiento(true);
      const { data, error } = await supabase
        .from("devoluciones_seguimiento")
        .select("*")
        .eq("devolucion_id", devolucion.id)
        .order("fecha_cambio", { ascending: false });

      if (error) {
        console.error("❌ Error cargando seguimiento:", error);
      } else {
        setSeguimiento(data);
      }
      setLoadingSeguimiento(false);
    };

    fetchSeguimiento();
  }, [devolucion.id]);

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <header className={`modal-header ${devolucion.estado_actual}`}>
          <h2>Detalles de Devolución</h2>
          <button className="btn-cerrar" onClick={onClose}>✕</button>
        </header>

        <div className="modal-body">
          {/* Información general */}
          <section className="bloque">
            <h3>Información general</h3>
            <ul className="lista-info">
              <li><strong>ID:</strong> {devolucion.id}</li>
              <li><strong>Empresa:</strong> {devolucion.empresa}</li>
              <li><strong>Cliente:</strong> {devolucion.cliente}</li>
              <li><strong>Vendedor:</strong> {devolucion.vendedor_nombre || "No asignado"}</li>
              <li><strong>Tipo cliente:</strong> {devolucion.tipo_cliente}</li>
              <li><strong>Fecha remisión:</strong> {devolucion.fecha_remision}</li>
              <li><strong>Fecha devolución:</strong> {devolucion.fecha_devolucion}</li>
              <li><strong>Motivo:</strong> {devolucion.motivo_devolucion_general}</li>
              <li>
                <strong>Estado actual:</strong>{" "}
                <span className={`badge-estado ${devolucion.estado_actual}`}>
                  {devolucion.estado_actual}
                </span>
              </li>
              <li><strong>Proceso en:</strong> {devolucion.proceso_en}</li>
              <li><strong>Plazo máximo:</strong> {devolucion.plazo_maximo} días</li>
              <li>
                <strong>Días entre remisión y devolución:</strong>{" "}
                {devolucion.dias_diferencia ?? "—"}
              </li>
              <li>
                <strong>Dentro del plazo:</strong>{" "}
                {devolucion.dentro_plazo === null
                  ? "—"
                  : devolucion.dentro_plazo
                  ? "✅ Sí"
                  : "❌ No"}
              </li>
              <li>
                <strong>Días transcurridos:</strong>{" "}
                {devolucion.dias_transcurridos ?? "—"}
              </li>
              <li>
                <strong>Registrado en sistema:</strong>{" "}
                {convertirAHoraCDMX(devolucion.created_at)}
              </li>
              <li>
                <strong>Última actualización:</strong>{" "}
                {convertirAHoraCDMX(devolucion.updated_at)}
              </li>
              {devolucion.fecha_registro_almacen && (
                <li>
                  <strong>Registro en almacén:</strong>{" "}
                  {convertirAHoraCDMX(devolucion.fecha_registro_almacen)}
                </li>
              )}
              {devolucion.fecha_registrada_pnv && (
                <li>
                  <strong>Registrada en PNV:</strong>{" "}
                  {convertirAHoraCDMX(devolucion.fecha_registrada_pnv)}
                </li>
              )}
            </ul>
          </section>

          {/* Productos */}
          <section className="bloque">
            <h3>Productos devueltos</h3>
            {devolucion.devoluciones_detalle?.length === 0 ? (
              <p>No hay productos asociados.</p>
            ) : (
              <table className="tabla">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Concepto / Sustancia</th>
                    <th>Cantidad</th>
                    <th>Estado</th>
                    <th>Motivo</th>
                    <th>Comentarios</th>
                  </tr>
                </thead>
                <tbody>
                  {devolucion.devoluciones_detalle.map((p, i) => (
                    <tr key={p.id || i}>
                      <td data-label="#">{i + 1}</td>
                      <td data-label="Concepto / Sustancia">{p.concepto_sustancia}</td>
                      <td data-label="Cantidad">{p.cantidad}</td>
                      <td data-label="Estado">{p.estado_producto}</td>
                      <td data-label="Motivo">{p.motivo_devolucion_producto}</td>
                      <td data-label="Comentarios">{p.comentarios || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Seguimiento */}
          <section className="bloque">
            <h3>
              <Clock size={16} color="#3b82f6" /> Historial de Seguimiento
            </h3>
            {loadingSeguimiento ? (
              <p>Cargando historial...</p>
            ) : seguimiento.length === 0 ? (
              <p>No hay movimientos registrados.</p>
            ) : (
              <div className="seguimiento-lista">
                {seguimiento.map((s, i) => (
                  <div key={s.id} className="seguimiento-card">
                    <div className="seguimiento-header">
                      <span className="seguimiento-numero">#{seguimiento.length - i}</span>
                      <span className="seguimiento-fecha">{convertirAHoraCDMX(s.fecha_cambio)}</span>
                    </div>

                    <div className="seguimiento-body">
                      <div className="seguimiento-row">
                        <div className="seguimiento-field">
                          <span className="field-label">Área</span>
                          <span className="field-value badge-area">{s.area}</span>
                        </div>
                        <div className="seguimiento-field">
                          <span className="field-label">Acción</span>
                          <span className="field-value badge-accion">{s.accion}</span>
                        </div>
                      </div>

                      <div className="seguimiento-row">
                        <div className="seguimiento-field">
                          <span className="field-label">Cambio por</span>
                          <span className="field-value">{s.cambiado_por}</span>
                        </div>
                      </div>

                      {(s.estado_anterior || s.estado_nuevo) && (
                        <div className="seguimiento-cambio">
                          <span className="cambio-label">Estado:</span>
                          <div className="cambio-flujo">
                            {s.estado_anterior && (
                              <span className={`badge-estado ${s.estado_anterior}`}>
                                {s.estado_anterior}
                              </span>
                            )}
                            {s.estado_anterior && s.estado_nuevo && (
                              <span className="cambio-flecha">→</span>
                            )}
                            <span className={`badge-estado ${s.estado_nuevo}`}>
                              {s.estado_nuevo}
                            </span>
                          </div>
                        </div>
                      )}

                      {(s.proceso_anterior || s.proceso_nuevo) && (
                        <div className="seguimiento-cambio">
                          <span className="cambio-label">Proceso:</span>
                          <div className="cambio-flujo">
                            {s.proceso_anterior && (
                              <span className="badge-proceso">{s.proceso_anterior}</span>
                            )}
                            {s.proceso_anterior && s.proceso_nuevo && (
                              <span className="cambio-flecha">→</span>
                            )}
                            <span className="badge-proceso">{s.proceso_nuevo}</span>
                          </div>
                        </div>
                      )}

                      {s.motivo && (
                        <div className="seguimiento-field full-width">
                          <span className="field-label">Motivo</span>
                          <span className="field-value">{s.motivo}</span>
                        </div>
                      )}

                      {s.observaciones && (
                        <div className="seguimiento-field full-width">
                          <span className="field-label">Observaciones</span>
                          <span className="field-value">{s.observaciones}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};