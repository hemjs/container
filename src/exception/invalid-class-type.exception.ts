import { INVALID_CLASS_TYPE_MESSAGE } from '../messages';
import { stringify } from '../utils';
import { RuntimeException } from './runtime.exception';

export class InvalidClassTypeException extends RuntimeException {
  constructor(value: any) {
    super(INVALID_CLASS_TYPE_MESSAGE`${stringify(value)}`);
  }
}
