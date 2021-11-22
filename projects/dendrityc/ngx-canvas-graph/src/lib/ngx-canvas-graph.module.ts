import { NgModule } from '@angular/core';
import { NgxSmartCanvasModule } from '@dendrityc/ngx-smart-canvas';
import { NgxCanvasGraphComponent } from './ngx-canvas-graph.component';

@NgModule({
  declarations: [
    NgxCanvasGraphComponent
  ],
  imports: [
    NgxSmartCanvasModule
  ],
  exports: [
    NgxCanvasGraphComponent
  ]
})
export class NgxCanvasGraphModule { }
