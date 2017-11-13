import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponseExplorerComponent } from './response-explorer.component';

describe('ResponseExplorerComponent', () => {
  let component: ResponseExplorerComponent;
  let fixture: ComponentFixture<ResponseExplorerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResponseExplorerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
