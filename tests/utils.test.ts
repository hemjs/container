import { stringify } from '../src/utils';

function foo() {}

describe('stringify', () => {
  it('should return string when given null', () => {
    expect(stringify(null)).toEqual('null');
  });

  it('should return same string when given string', () => {
    expect(stringify('abc')).toEqual('abc');
  });

  it('should return string when given symbol', () => {
    expect(stringify(Symbol('abc'))).toBe('Symbol(abc)');
  });

  it('should return string when given function', () => {
    expect(stringify(foo)).toBe('foo');
  });

  it('should return string when given class', () => {
    expect(stringify(Date)).toBe('Date');
  });

  it('should return string when given number', () => {
    expect(stringify(123)).toBe('123');
  });
});
