import { FormControl } from '@angular/forms';

export interface DamageForm {
  part: FormControl<string>;
  severity: FormControl<string>;
  imageUrl: FormControl<string>;
  price: FormControl<number>;
}
