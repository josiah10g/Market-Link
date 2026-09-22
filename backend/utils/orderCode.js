/**
 * Generates an order code in the format ML-XXXX (e.g. ML-3312)
 * Rendered in UI as #ML-XXXX
 */
const generateOrderCode = () => {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ML-${randomSuffix}`;
};

module.exports = { generateOrderCode };
