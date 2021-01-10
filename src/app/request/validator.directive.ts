import {Directive, Input} from '@angular/core';
import {AbstractControl, NG_VALIDATORS, Validator, ValidatorFn, Validators} from '@angular/forms';

@Directive({
  selector: '[appHalFormsProperty]',
  providers: [{provide: NG_VALIDATORS, useExisting: ValidatorDirective, multi: true}]
})
export class ValidatorDirective implements Validator {
  @Input('appHalFormsProperty') halFormsProperty: any;

  validate(control: AbstractControl): { [key: string]: any } | null {
    if (!this.halFormsProperty) {
      return null;
    }

    let validationResult = {};

    if (this.halFormsProperty.required) {
      validationResult = Object.assign(validationResult, Validators.required(control));
    }

    if (this.halFormsProperty.regex) {
      const validatorFn = Validators.pattern(this.halFormsProperty.regex);
      validationResult = Object.assign(validationResult, validatorFn(control));
    }

    return validationResult;
  }
}
