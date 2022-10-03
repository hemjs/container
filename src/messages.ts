export const INVALID_CLASS_MESSAGE = (
  text: TemplateStringsArray,
  name: string,
) => `Unable to instantiate class (${name} is not constructable).`;

export const INVALID_CLASS_TYPE_MESSAGE = (
  text: TemplateStringsArray,
  name: string,
) =>
  `An invalid class, "${name}", was provided; expected a defult (no-argument) constructor.`;
