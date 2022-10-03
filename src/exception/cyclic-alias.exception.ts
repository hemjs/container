import { ProviderToken } from '@hemjs/types/container';
import { CYCLIC_ALIAS_MESSAGE } from '../messages';
import { stringify } from '../utils';
import { RuntimeException } from './runtime.exception';

export class CyclicAliasException extends RuntimeException {
  constructor(alias: ProviderToken, aliases: Map<ProviderToken, any>) {
    let cycle = stringify(alias);
    let cursor = alias;

    while (aliases.has(cursor) && aliases.get(cursor) !== alias) {
      cursor = aliases.get(cursor);
      cycle += ' -> ' + stringify(cursor);
    }

    cycle += ' -> ' + stringify(alias) + '\n';

    super(CYCLIC_ALIAS_MESSAGE`${cycle}`);
  }
}
