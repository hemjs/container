import { toString } from '../src/utils';

function foo() {}

describe('toString', () => {
  it('should return string when given null', () => {
    expect(toString(null)).toEqual('null');
  });

  it('should return same string when given string', () => {
    expect(toString('abc')).toEqual('abc');
  });

  it('should return string when given symbol', () => {
    expect(toString(Symbol('abc'))).toBe('Symbol(abc)');
  });

  it('should return string when given function', () => {
    expect(toString(foo)).toBe('foo');
  });

  it('should return string when given class', () => {
    expect(toString(Date)).toBe('Date');
  });

  it('should return string when given number', () => {
    expect(toString(123)).toBe('123');
  });
});
