export function estandarizarMayusculas(texto) {
  if (!texto || typeof texto !== 'string') return texto;
  return texto.trim().toUpperCase();
}

export function normalizarCliente(cliente) {
  const ruta = estandarizarMayusculas(cliente.ruta_reparto);
  return {
    nombre: estandarizarMayusculas(cliente.nombre),
    ruta_reparto: ruta || ''
  };
}

export function claveCliente(cliente) {
  const { nombre, ruta_reparto } = normalizarCliente(cliente);
  return `${nombre}|${ruta_reparto}`;
}

export function formatClienteLabel(cliente) {
  if (!cliente) return '';
  const nombre = cliente.nombre || '';
  const ruta = cliente.ruta_reparto?.trim();
  return ruta ? `${nombre} — ${ruta}` : nombre;
}
