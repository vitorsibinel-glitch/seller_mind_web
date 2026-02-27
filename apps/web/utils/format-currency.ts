export const formatCurrency = (value?: number | null) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "R$ -";
  return `R$ ${num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
