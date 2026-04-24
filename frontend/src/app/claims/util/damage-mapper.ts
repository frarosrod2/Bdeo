import { DamageResponse } from '../model/api/damage-response';
import { Damage, Severity } from '../model/damage';
import { isDamageSeverity } from './is-damage-severity';

export function mapDamageResponse(damage: DamageResponse): Damage {
  return {
    id: damage._id,
    claimId: damage.claimId,
    part: damage.part,
    severity: isDamageSeverity(damage.severity) ? damage.severity : Severity.UNKNOWN,
    imageUrl: damage.imageUrl,
    price: damage.price,
    createdAt: new Date(damage.createdAt),
    updatedAt: new Date(damage.updatedAt),
  };
}
