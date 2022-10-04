export function toString(value: any): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value == null) {
    return '' + value;
  }

  if (value.name) {
    return `${value.name}`;
  }

  const result = value.toString();

  if (result == null) {
    return '' + result;
  }

  const newLineIndex = result.indexOf('\n');
  return newLineIndex === -1 ? result : result.substring(0, newLineIndex);
}
