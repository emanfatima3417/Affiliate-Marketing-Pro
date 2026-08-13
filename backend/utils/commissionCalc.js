// Centralized commission math so it's calculated the same way everywhere
const calcCommission = (price, quantity, percent) => {
  const saleAmount = Number((price * quantity).toFixed(2));
  const amount = Number(((saleAmount * percent) / 100).toFixed(2));
  return { saleAmount, amount };
};

module.exports = calcCommission;
