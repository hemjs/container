import { SERVICE_NOT_CREATED_MESSAGE } from '../messages';
import { RuntimeException } from './runtime.exception';

export class ServiceNotCreatedException extends RuntimeException {
  constructor(token: string | symbol, message: string) {
    super(SERVICE_NOT_CREATED_MESSAGE(token, message));
  }
}
