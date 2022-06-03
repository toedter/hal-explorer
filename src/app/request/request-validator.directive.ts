import {Directive, Input} from '@angular/core';
import {AbstractControl, UntypedFormControl, NG_VALIDATORS, Validator, Validators} from '@angular/forms';

@Directive({
  selector: '[appHalFormsProperty]',
  providers: [{provide: NG_VALIDATORS, useExisting: RequestValidatorDirective, multi: true}]
})
export class RequestValidatorDirective implements Validator {
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

    if (this.halFormsProperty.maxLength) {
      const testControl = new UntypedFormControl(control.value, Validators.maxLength(this.halFormsProperty.maxLength));
      validationResult = Object.assign(validationResult, testControl.errors);
    }

    if (this.halFormsProperty.minLength) {
      const testControl = new UntypedFormControl(control.value, Validators.minLength(this.halFormsProperty.minLength));
      validationResult = Object.assign(validationResult, testControl.errors);
    }

    if (this.halFormsProperty.max) {
      const testControl = new UntypedFormControl(control.value, Validators.max(this.halFormsProperty.max));
      validationResult = Object.assign(validationResult, testControl.errors);
    }

    if (this.halFormsProperty.min) {
      const testControl = new UntypedFormControl(control.value, Validators.min(this.halFormsProperty.min));
      validationResult = Object.assign(validationResult, testControl.errors);
    }

    if (this.halFormsProperty.type === 'email') {
      const testControl = new UntypedFormControl(control.value, Validators.email);
      validationResult = Object.assign(validationResult, testControl.errors);
    }

    if (this.halFormsProperty.options) {
      let noSelectedItems = 1;
      if (control.value instanceof Array) {
        noSelectedItems = control.value.length;
      }
      if (this.halFormsProperty.options.maxItems && (noSelectedItems > this.halFormsProperty.options.maxItems)) {
        validationResult = Object.assign(validationResult, {
          maxItems: {
            maxItems: this.halFormsProperty.options.maxItems,
            actual: control.value.length
          }
        });
      }
      if (this.halFormsProperty.options.minItems && (noSelectedItems < this.halFormsProperty.options.minItems)) {
        validationResult = Object.assign(validationResult, {
          minItems: {
            minItems: this.halFormsProperty.options.minItems,
            actual: control.value.length
          }
        });
      }
    }
    this.halFormsProperty.errors = validationResult;
    return validationResult;
  }
}
