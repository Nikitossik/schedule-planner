/**
 * Сокращает текст до указанного количества символов, обрезая по словам
 * @param {string} text - исходный текст
 * @param {number} maxLength - максимальная длина строки
 * @returns {string} сокращенный текст с многоточием если нужно
 */
export function truncateText(text, maxLength = 60) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  // Обрезаем по символам, но стараемся не разрывать слова
  let truncated = text.substring(0, maxLength);
  
  // Ищем последний пробел в обрезанной строке
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  // Если есть пробел и он не в самом начале, обрезаем по нему
  if (lastSpaceIndex > 0) {
    truncated = truncated.substring(0, lastSpaceIndex);
  }

  return truncated + '...';
}