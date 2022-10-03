import { isSymbol } from '@hemjs/util';

export const INVALID_CLASS_MESSAGE = (
  text: TemplateStringsArray,
  name: string,
) => `Unable to instantiate class (${name} is not constructable).`;

export const INVALID_CONSTRUCTOR_MESSAGE = (
  text: TemplateStringsArray,
  name: string,
) =>
  `An invalid class, "${name}", was provided; expected a defult (no-argument) constructor.`;

export const INVALID_PROVIDER_MESSAGE = (
  text: TemplateStringsArray,
  detail: string,
) =>
  `An invalid provider definition has been detected; only instances of Provider are allowed, got: [${detail}].`;

export const PROVIDER_NOT_FOUND_MESSAGE = (
  text: TemplateStringsArray,
  token: string,
) =>
  `No provider for "${token}" was found; are you certain you provided it during configuration?`;

export const CYCLIC_ALIAS_MESSAGE = (
  text: TemplateStringsArray,
  cycle: string,
) => `A cycle has been detected within the aliases definitions:\n ${cycle}`;

export const SERVICE_NOT_CREATED_MESSAGE = (
  token: string | symbol,
  message: string,
) => {
  token = isSymbol(token) ? token.toString() : token;
  return `Service for "${token}" could not be created. Reason: ${message}`;
};
