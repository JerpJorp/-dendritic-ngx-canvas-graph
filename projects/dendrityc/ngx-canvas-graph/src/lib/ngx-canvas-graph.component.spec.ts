import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxCanvasGraphComponent } from './ngx-canvas-graph.component';

describe('NgxCanvasGraphComponent', () => {
  let component: NgxCanvasGraphComponent;
  let fixture: ComponentFixture<NgxCanvasGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NgxCanvasGraphComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NgxCanvasGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
