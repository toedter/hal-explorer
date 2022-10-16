describe('HAL Explorer App', () => {

  const expectResponseDetailsAreDisplayed = () => {
    cy.contains('Response Status');
    cy.contains('Response Headers');
    cy.contains('Response Body');
  };

  it('Visits the initial HAL Explorer page', () => {
    cy.visit('/');
    cy.contains('HAL Explorer');
    cy.contains('Theme');
    cy.contains('Layout');
    cy.contains('About');
    cy.contains('Edit Headers');
    cy.contains('Go!');
  });

  it('should have title "HAL Explorer"', async () => {
    cy.visit('/');

    cy.title().should('eq', 'HAL Explorer');
  });

  it('should display "Edit Headers" as button text', () => {
    cy.visit('/');

    cy.contains('button.btn.btn-secondary', 'Edit Headers');
  });

  it('should not display HAL sections at startup', () => {
    cy.visit('/');

    cy.get('JSON Properties').should('not.exist');
    cy.get('Links').should('not.exist');
    cy.get('Embedded Resources').should('not.exist');
    cy.get('Response Status').should('not.exist');
    cy.get('Response Headers').should('not.exist');
    cy.get('Response Body').should('not.exist');
  });

  it('should display HAL sections when rendering users resource', () => {
    cy.visit('/#uri=http://localhost:3000/movies.hal-forms.json');

    cy.contains('JSON Properties');
    cy.contains('Links');
    cy.contains('HAL-FORMS Template Elements');
    cy.contains('Embedded Resources');

    expectResponseDetailsAreDisplayed();
  });

  it('should display only Links section when rendering root api', () => {
    cy.visit('/#uri=http://localhost:3000/index.hal.json');

    cy.get('JSON Properties').should('not.exist');
    cy.get('Embedded Resources').should('not.exist');
    cy.contains('Links');
    expectResponseDetailsAreDisplayed();
  });

  it('should display POST request dialog', () => {
    cy.visit('/#uri=http://localhost:3000/movies.hal-forms.json');
    cy.get('button.icon-plus').eq(3).click();
    cy.contains('HTTP Request Input').should('be.visible');
  });

  it('should display user profile in POST request dialog', () => {
    cy.visit('/#uri=http://localhost:3000/index.hal.json');
    cy.get('button.icon-plus').eq(0).click();
    cy.contains('Email').should('be.visible');
    cy.contains('Full name').should('be.visible');
    cy.contains('Id').should('be.visible');
  });

  it('should display expanded URI in HAL-FORMS GET request dialog', () => {
    cy.visit('/#uri=http://localhost:3000/filter.hal-forms.json');
    cy.get('button.icon-left-open').last().click();

    cy.get('input[id="request-input-title"]').type('myTitle');
    cy.get('input[id="request-input-completed"]').type('true');

    cy.get('[id="request-input-expanded-uri"]').should('have.text',
      ' http://localhost:3000/filter.hal-forms.json?title=myTitle&completed=true ');
  });

  it('should display correct properties HAL-FORMS POST request dialog', () => {
    cy.visit('/#uri=http://localhost:3000/2posts1get.hal-forms.json');
    cy.get('button.icon-plus').last().click();
    cy.get('input[id="request-input-post2"]').type('xxx');

    cy.get('[id="body"]').should('have.value', '{\n  "post2": "xxx"\n}');
  });

});

