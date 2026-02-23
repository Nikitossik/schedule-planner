
export function truncateText(text, maxLength = 60) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }


  let truncated = text.substring(0, maxLength);
  

  const lastSpaceIndex = truncated.lastIndexOf(' ');
  

  if (lastSpaceIndex > 0) {
    truncated = truncated.substring(0, lastSpaceIndex);
  }

  return truncated + '...';
}