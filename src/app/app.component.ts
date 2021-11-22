import { Component, OnInit } from '@angular/core';

import * as faker from "faker";

import { GraphBuilder, Node, BuiltNode, Link, GraphData, ICustomClear, ILinkCustomPostDraw, ILinkCustomPreDraw, INodeCustomPostDraw, INodeCustomPreDraw  } from '@dendrityc/ngx-canvas-graph';
import { CanvasHelper } from '@dendrityc/ngx-smart-canvas';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  
  lastMessage = '';

  graphData: GraphData = new GraphData();

  plain = true;
  constructor() { }

  ngOnInit(): void {
    this.FakeAndDraw(); 
  }

  nodeClick(node: Node) {
    if (node) {this.lastMessage = 'clicked on ' + node.displayText;}
  }

  nodeMouseOver(node: Node) {
    if (node) {this.lastMessage = 'mouse over ' + node.displayText;}
  }

  recreate() {
    this.FakeAndDraw();
  }

  FakeAndDraw() {
    const builder: GraphBuilder = new GraphBuilder();
    const root = builder.AddNode(new Node('Root'));
    this.RecurseBuild(root, 0, 10);
    this.graphData = new GraphData();
    this.graphData = builder.graphData;
  }

  RecurseBuild(root: BuiltNode, depth: number, maxDepth: number) {

    if (depth < maxDepth) {
      Array(3).fill(0).forEach((value, idx) => {

        if (Math.random() > 0.8 || idx === 0) {

          const linkText =Math.random() > 0.5 ? '' : faker.lorem.words(2);
          const child = root.AddLinkTo(new Link(
            linkText,
            'rgba(5,5,5,.125)',
            'yellow',
            'black'), new Node(faker.lorem.words(2)));
          this.RecurseBuild(child.endNode, depth + 1, maxDepth);  
        }
      });
    }
  }

  clearOverride(params: ICustomClear) {
    const ctx = params.ctx;

    params.ctx.shadowColor = '#12FF12';
    params.ctx.shadowBlur = 0;

    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    // Will always clear the right space
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);

    const grd = ctx.createLinearGradient(0, 0, 170,0);
    grd.addColorStop(0, "#BBBBBB");
    grd.addColorStop(1, "white");

    ctx.fillStyle = grd;
    ctx.fillRect(0,0,ctx.canvas.width / 2,ctx.canvas.height);

    ctx.restore();
  }

  linkPreDraw(params: ILinkCustomPreDraw) {
    params.skipDefaultDraw = false;
  }

  linkPostDraw(params: ILinkCustomPostDraw) {

  }

  nodePreDraw(params: INodeCustomPreDraw) {
    CanvasHelper.roundRect(params.ctx, params. extNode.x-5, params.extNode.y-5, params.extNode.width+10, params.extNode.height+10, 4);
    params.ctx.fillStyle = 'brown';
    params.ctx.shadowColor = '#050505';
    params.ctx.shadowBlur = 12;
    params.ctx.fill();
    params.skipDefaultDraw = false;
    
  }

  nodePostDraw(params: INodeCustomPostDraw) {
    
  }


 

}
