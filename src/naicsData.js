/**
 * Gets the industry adjustment factor. MODIFIED TO ALWAYS RETURN 1.0
 * @param {string} sectorName - The name of the selected top-level sector (ignored).
 * @param {string} subSectorName - The specific name of the sub-sector (ignored).
 * @returns {number} - Always returns 1.0.
 */
export const getIndustryAdjustmentFactor = (sectorName, subSectorName) => {
  // Ya no necesitamos buscar en los datos porque queremos ignorar el ajuste.
  // Simplemente devolvemos 1.0 para que los múltiplos no se modifiquen.
  return 1.0;
};