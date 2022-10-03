import { PROVIDER_NOT_FOUND_MESSAGE } from '../messages';
import { RuntimeException } from './runtime.exception';

export class ProviderNotFoundException extends RuntimeException {
  constructor(token: any) {
    super(PROVIDER_NOT_FOUND_MESSAGE`${token}`);
  }
}
