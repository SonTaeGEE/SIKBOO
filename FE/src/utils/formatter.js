// 숫자 포맷 함수 (천 단위 쉼표)
export const formatNumber = (numStr) => {
  const digits = String(numStr).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString();
};
