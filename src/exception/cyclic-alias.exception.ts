import { ProviderToken } from '@hemtypes/container';
import { CYCLIC_ALIAS_MESSAGE } from '../messages';
import { toString } from '../utils';
import { RuntimeException } from './runtime.exception';

export class CyclicAliasException extends RuntimeException {
  constructor(alias: ProviderToken, aliases: Map<ProviderToken, any>) {
    let cycle = toString(alias);
    let cursor = alias;

    while (aliases.has(cursor) && aliases.get(cursor) !== alias) {
      cursor = aliases.get(cursor);
      cycle += ' -> ' + toString(cursor);
    }

    cycle += ' -> ' + toString(alias) + '\n';

    super(CYCLIC_ALIAS_MESSAGE`${cycle}`);
  }
}
