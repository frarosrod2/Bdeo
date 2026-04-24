import { Severity } from '../model/damage';

export function isDamageSeverity(value: string): value is Severity {
  return Object.values(Severity).includes(value as Severity);
}
