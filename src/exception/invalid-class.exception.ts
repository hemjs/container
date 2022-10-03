import { INVALID_CLASS_MESSAGE } from '../messages';
import { stringify } from '../utils';
import { RuntimeException } from './runtime.exception';

export class InvalidClassException extends RuntimeException {
  constructor(value: any) {
    super(INVALID_CLASS_MESSAGE`${stringify(value)}`);
  }
}
