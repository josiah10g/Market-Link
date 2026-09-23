
const generateOrderCode = () => {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ML-${randomSuffix}`;
};

module.exports = { generateOrderCode };
