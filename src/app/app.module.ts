import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxCanvasGraphModule } from '@dendrityc/ngx-canvas-graph';
import { NgxSmartCanvasModule  } from '@dendrityc/ngx-smart-canvas';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    NgxSmartCanvasModule,
    NgxCanvasGraphModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
