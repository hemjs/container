import { isPlainObject } from '@hemjs/util';
import { INVALID_PROVIDER_MESSAGE } from '../messages';
import { stringify } from '../utils';
import { RuntimeException } from './runtime.exception';

export class InvalidProviderException extends RuntimeException {
  constructor(value: any) {
    const detail = isPlainObject(value)
      ? JSON.stringify(value)
      : stringify(value);
    super(INVALID_PROVIDER_MESSAGE`${detail}`);
  }
}
