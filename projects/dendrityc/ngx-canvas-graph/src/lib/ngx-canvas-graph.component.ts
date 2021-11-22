import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges, EventEmitter, Output } from '@angular/core';

import { Subject } from 'rxjs';

import * as dagre from "dagre";
import * as uuid from 'uuid';

import { ViewPort, Layer, CanvasHelper, HelperLine, ILayerAndMouseInfo } from '@dendrityc/ngx-smart-canvas';

import { Node } from './node';
import { Link } from './link';
import { GraphData, IExtendedEdge, IExtendedNode } from './graph-data';

import { ICustomClear, 
    ILinkCustomPostDraw, ILinkCustomPreDraw, 
    INodeCustomPostDraw, INodeCustomPreDraw } from './override-parameters';

import { ExpansionModifier } from './expansion-modifier';


@Component({
  selector: 'lib-ngx-canvas-graph',
  templateUrl: './ngx-canvas-graph.component.html',
  styles: [
  ]
})
export class NgxCanvasGraphComponent implements OnInit, OnChanges, OnDestroy {

  @Input() graphId = uuid.v4();

  @Input() graphData = new GraphData();
  
  @Input() graphSettings: dagre.GraphLabel = { 
    width: 1800, 
    height: 1000, 
    nodesep: 20, 
    ranksep: 15, 
    rankdir: 'LR' };
  
  @Input() initialCollapseDepth = 99;

  @Output() nodeClick = new EventEmitter<Node>();
  @Output() nodeDoubleClick = new EventEmitter<Node>();
  @Output() nodeMouseOver = new EventEmitter<Node>();
  @Output() linkClick = new EventEmitter<Link>();
  @Output() linkDoubleClick = new EventEmitter<Link>();
  @Output() linkMouseOver = new EventEmitter<Link>();

  @Output() linkPreDraw = new EventEmitter<ILinkCustomPreDraw>();
  @Output() linkPostDraw = new EventEmitter<ILinkCustomPostDraw>();

  @Output() nodePreDraw = new EventEmitter<INodeCustomPreDraw>();
  @Output() nodePostDraw = new EventEmitter<INodeCustomPostDraw>();

  @Output() clearOverride = new EventEmitter<ICustomClear>();
  
  destroyed$: Subject<void> = new Subject<void>();

  edges: IExtendedEdge[] = [];
  nodes: dagre.Node<IExtendedNode>[] = [];

  lastMousedNode: Node | undefined;

  expansionModifier: ExpansionModifier | undefined;

  mainLayer: Layer | undefined;
  overlayLayer: Layer | undefined;
  constructor() { }

  viewportReady(viewPort: ViewPort) {
  
    this.mainLayer = viewPort.AddLayer();
    this.overlayLayer = viewPort.AddLayer();
    
    this.expansionModifier = new ExpansionModifier(this.graphData, this.initialCollapseDepth);

    this.Draw();
    viewPort.render();
  }

  redrawRequest(layer: Layer) {

    if (this.mainLayer && layer.id === this.mainLayer.id) { this.Draw(); }
    layer.parentViewport.render();
  }

  ngOnInit(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.graphData) {
      this.expansionModifier = new ExpansionModifier(this.graphData, this.initialCollapseDepth);
      this.ProcessNodes();
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
  }

  ProcessNodes(): void {
    const data = this.expansionModifier?.uncollapsedGraphData;
    if (data && data.nodes.length > 0) {
      const nodes = data.nodes;
      const links = data.links;
      const graph = new dagre.graphlib.Graph();
      graph.setGraph(this.graphSettings);
      nodes.forEach(node => graph.setNode(node.id, { width: 50 + node.displayText.length * 8, height: 42, source: node }));
      links.forEach(link => graph.setEdge(link.fromNodeId as string, link.toNodeId as string, { source: link }));
      dagre.layout(graph);
      this.edges = graph.edges()
        .map(e => {
          const x = graph.edge(e) as unknown as {source: Link, points: Array<{ x: number; y: number }>};        

          const startNode = graph.node(e.v);
          const endNode = graph.node(e.w);

          const edge: IExtendedEdge = { 
            start: startNode, 
            end: endNode, 
            startCenter: {x: startNode.x + (startNode.width / 2), y: startNode.y + (startNode.height / 2)},
            endCenter: {x: endNode.x + (endNode.width / 2), y: endNode.y + (endNode.height / 2)},
            link: x.source, 
            points: x.points };

          return edge;
        })
        .filter(x => x.start && x.end) ;

      this.nodes = graph.nodes().map(n => graph.node(n) as dagre.Node<IExtendedNode>);
    }
    if (this.mainLayer) {
      
      this.Draw();
      this.mainLayer.parentViewport.render();
    }
  }
 
  Draw() {

    if (this.mainLayer) {
      this.mainLayer.scene.clear();      
      const context = this.mainLayer.scene.context;
      this.edges.forEach(e => this.drawEdge(e, context));
      this.nodes.forEach(n => this.drawNode(n, context));
            
    }
  }

  private drawEdge(e: IExtendedEdge, ctx: CanvasRenderingContext2D) {

    if (this.linkPreDraw.observers.length > 0) {
      const p: ILinkCustomPreDraw = {extEdge: e, ctx: ctx, skipDefaultDraw: true};
      this.linkPreDraw.emit(p);
      if (p.skipDefaultDraw) {
        return;
      }
    }

    ctx.strokeStyle = e.link.lineColor || 'rgba(200,200,200,.125)';
    ctx.lineWidth  = 3;

    const helper = new HelperLine(e.startCenter, e.endCenter);
    ctx.beginPath();
    ctx.moveTo(e.startCenter.x, e.startCenter.y);
    ctx.lineTo(e.endCenter.x, e.endCenter.y);
    ctx.stroke();

    if (this.linkPostDraw.observers.length > 0) {
      const p: ILinkCustomPostDraw = {extEdge: e, ctx: ctx};
      this.linkPostDraw.emit(p);
    }


  }

  private drawNode(n: dagre.Node<IExtendedNode>, ctx: CanvasRenderingContext2D) {
    
    if (this.nodePreDraw.observers.length > 0) {
      const p: INodeCustomPreDraw = {extNode: n, ctx: ctx, skipDefaultDraw: true};
      this.nodePreDraw.emit(p);
      if (p.skipDefaultDraw) {
        return;
      }
    }

    ctx.font = "18px system-ui";
    ctx.textAlign = 'center'
    ctx.lineWidth  = 3;
    ctx.shadowColor = '#AAAAAA';
    ctx.shadowBlur = 4;

    ctx.fillStyle = n.source.backColor ? n.source.backColor : '#dddddd';
    CanvasHelper.roundRect(ctx, n.x, n.y, n.width, n.height, 5);    
    ctx.fill();    
    ctx.strokeStyle = 'black';    
    ctx.stroke();
    if (n.source.internalDisplayState === 'collapsed') {
      this.drawExpandIndicator(n, ctx);
    } 
    
    if (n.source.displayText) {
      ctx.fillStyle = n.source.textColor ? n.source.textColor : 'black';
      ctx.fillText(n.source.displayText, n.x + (n.width / 2), n.y + 27);
    }

    if (this.nodePostDraw.observers.length > 0) {
      const p: INodeCustomPostDraw = {extNode: n, ctx: ctx};
      this.nodePostDraw.emit(p);
    }

  }

  drawExpandIndicator(n: dagre.Node<IExtendedNode>, ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.ellipse(n.x + n.width + 8, n.y + n.height / 2, 3, 4, 0, 0, 2 * Math.PI)
    ctx.closePath();
    ctx.stroke();
  }

  MouseOver(event: ILayerAndMouseInfo): void {

    if (event.layer.id !== this.mainLayer?.id) { return; }

    const matching = this.findMatchingNode(event);
    if (matching) {
      if (this.lastMousedNode && this.lastMousedNode.id === matching.id) {
        // do nothing
      } else {
        this.lastMousedNode = matching;
        this.nodeMouseOver.emit(matching);        
        this.overlayLayer?.scene.clear();
        this.overlayLayer?.parentViewport.render();
      }
    } else {
      const link = this.findClosestLink(event);
      if (this.overlayLayer?.scene.context) {
        this.overlayLayer.scene.clear();
        if (link && link.link.displayText && link.link.displayText.length > 0) {
          const ctx = this.overlayLayer.scene.context;

          const helper = new HelperLine(link.start, link.end, undefined);
          //ctx.fillStyle = link.link.color  ? link.link.color : 'black';
          
          ctx.textAlign = "center";
          ctx.font = "14px system-ui";

          const textSize =  ctx.measureText(link.link.displayText);
          const x = textSize.actualBoundingBoxLeft + event.mouseToCanvas.canvasXY.x;
          const y = event.mouseToCanvas.canvasXY.y - textSize.actualBoundingBoxAscent;
          
          ctx.fillStyle = link.link.bgColor || '#dddddd';
          CanvasHelper.roundRect(ctx, event.mouseToCanvas.canvasXY.x - 4, event.mouseToCanvas.canvasXY.y - 15, textSize.width + 8, 20, 3);
          ctx.fill();

          ctx.fillStyle = link.link.textColor || 'black';
          ctx.textBaseline = 'hanging';
          ctx.textAlign = 'left';         
          ctx.fillText(link.link.displayText,  event.mouseToCanvas.canvasXY.x, event.mouseToCanvas.canvasXY.y - 15);
          
        }
        this.overlayLayer.parentViewport.render();
      }
    }
  }

  MouseDoubleClick(event: ILayerAndMouseInfo): void {

    if (event.layer.id !== this.mainLayer?.id) { return; }

    console.log('MouseDoubleClick');
    const matching = this.findMatchingNode(event);
    this.lastMousedNode = matching;

    if (this.expansionModifier && matching) {
      if (this.expansionModifier.ToggleCollapse(matching, event.mouseToCanvas.mouseEvent.ctrlKey || false)) {
        this.ProcessNodes();
      }

    }
    if (this.lastMousedNode) {
      this.nodeDoubleClick.emit(matching);
    }
  }

  
  MouseClick(event: ILayerAndMouseInfo): void {

    if (event.layer.id !== this.mainLayer?.id) { return; }

    console.log('MouseClick');
    if (event.mouseToCanvas?.mouseEvent.shiftKey) {
      this.MouseDoubleClick(event);
    } else {
      const matching = this.findMatchingNode(event);
      this.lastMousedNode = matching;
  
      if (this.lastMousedNode) {
        this.nodeClick.emit(matching);
      }  
    }
  }
  
  private findClosestLink(event: ILayerAndMouseInfo): IExtendedEdge | undefined {

    
    const lines =  this.edges.map(edge => new HelperLine(edge.startCenter, edge.endCenter, edge));

    const lineMatch = CanvasHelper.LineHit(lines, event.mouseToCanvas.canvasXY, 20);

    if (lineMatch) {
      return lineMatch.id as IExtendedEdge
    } else {
      return undefined;
    }

  }

  private findMatchingNode(event: ILayerAndMouseInfo): Node | undefined {

    if (event.mouseToCanvas) {
      
      const canvasXY = event.mouseToCanvas.canvasXY;

      const matching = this.nodes.find(n =>
        n.x < canvasXY.x && canvasXY.x < n.x + n.width &&
        n.y < canvasXY.y && canvasXY.y < n.y + n.height);

      return matching ? matching.source : undefined;

    } else {
      return undefined;
    }
  }


}



