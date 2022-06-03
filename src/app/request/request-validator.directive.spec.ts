import {AbstractControl, UntypedFormControl} from '@angular/forms';
import {RequestValidatorDirective} from './request-validator.directive';

describe( 'RequestValidatorDirective', () => {
  it( 'should create an instance', () => {
    const directive = new RequestValidatorDirective();
    expect( directive ).toBeTruthy();
  } );

  it( 'should validate undefined value and "required"', () => {
    const directive = new RequestValidatorDirective();
    directive.halFormsProperty = {
      required: true
    };

    const control: AbstractControl = new UntypedFormControl();
    const validationResult = directive.validate( control );

    expect( validationResult.required ).toBeTrue();
  } );

  it( 'should validate defined value and "required"', () => {
    const directive = new RequestValidatorDirective();
    directive.halFormsProperty = {
      required: true
    };

    const control: AbstractControl = new UntypedFormControl( 'x' );
    const validationResult = directive.validate( control );
    expect( validationResult ).toEqual( {} );
  } );

  it( 'should validate invalid email and "regex"', () => {
    const directive = new RequestValidatorDirective();
    directive.halFormsProperty = {
      regex: '^([a-zA-Z0-9_\\-\\.]+)@([a-zA-Z0-9_\\-\\.]+)\\.([a-zA-Z]{2,5})$'
    };

    const control: AbstractControl = new UntypedFormControl( 'invalid@email' );
    const validationResult = directive.validate( control );

    expect( validationResult.pattern.requiredPattern )
      .toBe( '^([a-zA-Z0-9_\\-\\.]+)@([a-zA-Z0-9_\\-\\.]+)\\.([a-zA-Z]{2,5})$' );
    expect( validationResult.pattern.actualValue )
      .toBe( 'invalid@email' );
  } );

  it( 'should validate valid email and "regex"', () => {
    const directive = new RequestValidatorDirective();
    directive.halFormsProperty = {
      regex: '^([a-zA-Z0-9_\\-\\.]+)@([a-zA-Z0-9_\\-\\.]+)\\.([a-zA-Z]{2,5})$'
    };

    const control: AbstractControl = new UntypedFormControl( 'valid@email.com' );
    const validationResult = directive.validate( control );

    expect( validationResult ).toEqual( {} );
  } );

  it( 'should validate value with length <= "maxLength"', () => {
    const directive = new RequestValidatorDirective();
    directive.halFormsProperty = {
      maxLength: 3
    };

    const control: AbstractControl = new UntypedFormControl( 'xxx' );
    const validationResult = directive.validate( control );

    expect( validationResult ).toEqual( {} );
  } );

  it( 'should validate value with length > "maxLength"', () => {
    const directive = new RequestValidatorDirective();
    directive.halFormsProperty = {
      maxLength: 3
    };

    const control: AbstractControl = new UntypedFormControl( 'xxxx' );
    const validationResult = directive.validate( control );

    expect( validationResult.maxlength.requiredLength ).toBe( 3 );
    expect( validationResult.maxlength.actualLength ).toBe( 4 );
  } );

  it( 'should validate value with length >= "minLength"', () => {
    const directive = new RequestValidatorDirective();
    directive.halFormsProperty = {
      minLength: 3
    };

    const control: AbstractControl = new UntypedFormControl( 'xxx' );
    const validationResult = directive.validate( control );

    expect( validationResult ).toEqual( {} );
  } );

  it( 'should validate value with length < "minLength"', () => {
    const directive = new RequestValidatorDirective();
    directive.halFormsProperty = {
      minLength: 3
    };

    const control: AbstractControl = new UntypedFormControl( 'xx' );
    const validationResult = directive.validate( control );

    expect( validationResult.minlength.requiredLength ).toBe( 3 );
    expect( validationResult.minlength.actualLength ).toBe( 2 );
  } );

  it( 'should validate value <= "max"', () => {
    const directive = new RequestValidatorDirective();
    directive.halFormsProperty = {
      max: 10
    };

    const control: AbstractControl = new UntypedFormControl( '10' );
    const validationResult = directive.validate( control );

    expect( validationResult ).toEqual( {} );
  } );

  it( 'should validate value > "max"', () => {
    const directive = new RequestValidatorDirective();
    directive.halFormsProperty = {
      max: 10
    };

    const control: AbstractControl = new UntypedFormControl( 11 );
    const validationResult = directive.validate( control );

    expect( validationResult.max.max ).toBe( 10 );
    expect( validationResult.max.actual ).toBe( 11 );
  } );

  it( 'should validate value >= "min"', () => {
    const directive = new RequestValidatorDirective();
    directive.halFormsProperty = {
      min: 10
    };

    const control: AbstractControl = new UntypedFormControl( '10' );
    const validationResult = directive.validate( control );
    expect( validationResult ).toEqual( {} );
  } );

  it( 'should validate value < "min"', () => {
    const directive = new RequestValidatorDirective();
    directive.halFormsProperty = {
      min: 10
    };

    const control: AbstractControl = new UntypedFormControl( 9 );
    const validationResult = directive.validate( control );

    expect( validationResult.min.min ).toBe( 10 );
    expect( validationResult.min.actual ).toBe( 9 );
  } );

  it( 'should validate invalid email input type', () => {
    const directive = new RequestValidatorDirective();
    directive.halFormsProperty = {
      type: 'email'
    };

    const control: AbstractControl = new UntypedFormControl( 'bad@' );
    const validationResult = directive.validate( control );

    expect( validationResult.email ).toBe( true );
  } );

  it( 'should not validate when halFormsProperty is not set', () => {
    const directive = new RequestValidatorDirective();
    directive.halFormsProperty = undefined;

    const control: AbstractControl = new UntypedFormControl( 9 );
    const validationResult = directive.validate( control );

    expect( validationResult ).toBe( null );
  } );

  it( 'should validate value array length < "options.minItems"', () => {
    const directive = new RequestValidatorDirective();
    directive.halFormsProperty = {
      options: {
        minItems: 1
      }
    };

    const control: AbstractControl = new UntypedFormControl( [] );
    const validationResult = directive.validate( control );

    expect( validationResult.minItems.minItems ).toBe( 1 );
    expect( validationResult.minItems.actual ).toBe( 0 );
  } );

  it( 'should validate value array length > "options.maxItems"', () => {
    const directive = new RequestValidatorDirective();
    directive.halFormsProperty = {
      options: {
        maxItems: 1
      }
    };

    const control: AbstractControl = new UntypedFormControl( ['a', 'b'] );
    const validationResult = directive.validate( control );

    expect( validationResult.maxItems.maxItems ).toBe( 1 );
    expect( validationResult.maxItems.actual ).toBe( 2 );
  } );

});
