import { INVALID_CONSTRUCTOR_MESSAGE } from '../messages';
import { stringify } from '../utils';
import { RuntimeException } from './runtime.exception';

export class InvalidConstructorException extends RuntimeException {
  constructor(value: any) {
    super(INVALID_CONSTRUCTOR_MESSAGE`${stringify(value)}`);
  }
}
