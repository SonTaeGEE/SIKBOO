// 한국 시간대로 명시적으로 ISO 문자열 생성
export const formatKSTDateTime = (datetimeLocal) => {
  // datetime-local 형식: "2025-11-13T17:00"
  const date = new Date(datetimeLocal);

  // 한국 시간대로 ISO 문자열 생성
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // "2025-11-13T17:00:00+09:00" 형식
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+09:00`;
};
