import { field } from "svelte-forms";
import type { FieldOptions } from "svelte-forms/types";
import { required } from "svelte-forms/validators";
import type { Validator } from "svelte-forms/validators/validator";

export function standardField(
  name: string,
  value: any,
  validators: Validator[],
  options?: Partial<FieldOptions>
) {
  if (!validators) validators = [];
  if (!options) options = {};

  validators.push(required());
  if (!("checkOnInit" in options)) {
    options.checkOnInit = true;
  }
  return field(name, value, validators, options);
}
