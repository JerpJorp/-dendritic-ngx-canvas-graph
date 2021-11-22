# @dendrityc/ngx-canvas-graph

This library provides the ngx-canvas-graph component (lib-ngx-canvas-graph) that renders graphs using the dagre graph layout algorithm (https://www.npmjs.com/package/dagre).

The library is a result of running into performance issues with the @swimlane/ngx-graph library, which uses svg and allows for user interactivity with the rendered noded for moving them around that causes performance issues with high node counts.  

The graphing component relies on @dendrityc/ngx-smart-canvas (https://www.npmjs.com/package/@dendrityc/ngx-smart-canvas), which provides a component for wrapping a canvas element and handling scroll/zoom.  

Example usage 
```html

        <lib-ngx-canvas-graph [graphId]="'customId'" 
          [graphSettings]="{ 
            width: 1800, 
            height: 1000, 
            nodesep: 25, 
            ranksep: 10, 
            rankdir: 'LR' }"
          [initialCollapseDepth]="2"
          [graphData]="graphData"
          (nodeClick)="nodeClick($event)"
          (nodeMouseOver)="nodeMouseOver($event)"
          (clearOverride)="clearOverride($event)"
          (linkPostDraw)="linkPostDraw($event)"
          (linkPreDraw)="linkPreDraw($event)"
          (nodePreDraw)="nodePreDraw($event)"
          (nodePostDraw)="nodePostDraw($event)"
          ></lib-ngx-canvas-graph>


```

### component parameters

* **graphId**: Important only if you are displaying multiple graphs in the same view as it is used to uniquely tag underlying elements.  If not provided, a generic uuid is auto-generated
* **graphSettings**: Instance of dagre.GraphLabel from @types/dagre, and represents the available parameters for the dagre layout algorithm. Default:
```javascript
{   width: 1800, 
    height: 1000, 
    nodesep: 20, 
    ranksep: 15, 
    rankdir: 'LR' }
```
* **initialCollapseDepth**: sets the initial depth in the graph where nodes are collapsed.  Default is 99, which means essentially none are collapsed.  

* **graphData**: Represents the nodes and edges that will be positioned by the dagre algorithm and rendered as a graph.  Updating this input parameter will triger a layout/render cycle.
```javascript
export class GraphData {
    nodes: Node[] = [];
    links: Link[] = []; }
class Node {
    id: string;
    displayText: string; 
    backColor?: string; 
    textColor?: string;
    properties?: { [index: string]: any}) }
class Link {
    fromNodeId: string | undefined;
    toNodeId: string | undefined;
    displayText: string; 
    color?: string;
    properties?: { [index: string]: any}) }
```
* **nodeClick**: Emitted when user clicks on a node (parameter is your Node instance)
* **nodeDoubleClick**: Emitted when user double clicks on a node (parameter is your Node instance).  Note that nodeClick will fire first
* **nodeMouseOver**: Emitted when user hovers on a node (parameter is your Node instance)
* **nodePreDraw/nodePostDraw**: Emitted before and after drawing a node.  You can implement your own drawing before/after and tell the component to skip default drawing via nodePreDraw.skipDefaultDraw = true
* **linkPreDraw/linkPostDraw**: Emitted before and after drawing a link.  You can implement your own drawing before/after and tell the component to skip default drawing via linkPreDraw.skipDefaultDraw = true
* **clearOverride**:  Emitted when clearing the canvas. If provided by your code, you can draw/clear/color the blank canvas however you want before the graph rendering occurs
* 
### Other items of note
* To optimize performance, there is no handling of user interaction with the canvas to reposition rendered nodes.  The component relies on the dagre layout algorithm, and the resulting layout is static.  
* Collapse/expand
    *   If you use the initialCollapseDepth input parameter, the component will collapse all nodes beyond the depth value.
    *   Users can toggle expand/collapse after the graph is rendered
        * **double click** toggles expand/collapse for node under mouse
        * **click**
            *   with shift modifer, toggles expand/collapse
            *   with shift + ctrl modifier, toggles expand/collapse for node and all descendents


### Building a graph

The library comes with a graph builder class that handles making nodes/links intuitively.  Here is an example taking a data structure and turning into a graph
```javascript
import { Project } from "./project";
import { Action } from "./action";
import { Possibility } from "./possibility";
import { BuiltNode, GraphBuilder, Link, Node } from "ngx-canvas-graph";
import { BuType, SelectedUnit } from "./common";
import { BaseUnit } from "./base-unit";

export class ProjectToCanvasGraph {

    static readonly RootID = 'rootID';

    static readonly ColorLkp: {[index: string]: {backColor: string, textColor: string};} = {
        'situation':    {backColor: '#0c515c', textColor: '#5dbecd'},
        'possibility':  {backColor: '#005e46', textColor: '#4dd0af'},       
        'action':       {backColor: '#74261e', textColor: '#ee8277'},
        'condition':    {backColor: '#74261e', textColor: '#ee8277'},
    };

    static seenActionNodes: {id: string, node: Node}[];

    static Build(project: Project): GraphBuilder {
        this.seenActionNodes = [];
        const builder: GraphBuilder = new GraphBuilder();
        const rootNode = new Node('Flows', '#313131', '#919191', {path: 'Flows'}, 'idROOT' );
        
        const root = builder.AddNode(new Node('Flows', '#313131', '#919191', {path: 'Flows'}, 'idROOT' ));
        project.situations.filter(x => x.initial).forEach(situation => {
            const s = root.AddLinkTo(new Link('', '#DDDDDD'), this.newNode(situation, 'situation', root.node));
            situation.possibilityIds.map(pid => project.possibilities.find(x => x.id === pid))
                .filter(x => x !== undefined)
                .map(x => x as Possibility)
                .forEach(possibility => {
                    const p = s.endNode.AddLinkTo(new Link('', '#DDDDDD'), this.newNode(possibility, 'possibility', s.endNode.node));
                    possibility.actions.forEach(action => {
                        const s = p.endNode.AddLinkTo(new Link('', '#DDDDDD'), this.newNode(action, 'action', p.endNode.node)); 
                        this.addActionConditions(builder, action, s.endNode);
                    });
                });
        });

        return builder;
    }

    private static addActionConditions(builder: GraphBuilder, action: Action, actionBuiltNode: BuiltNode) {
        action.conditions
            .filter(c => c.action !== undefined)
            .forEach(condition => {
                const targetAction = condition.action as Action; 

                // this action might already exist 
                const existing = this.seenActionNodes.find(x => x.id === targetAction.id);
                
                if (existing) {
                    const tabn = actionBuiltNode.AddLinkTo(new Link('', '#767676'), existing.node);
                    
                } else {
                    const tabn = actionBuiltNode.AddLinkTo(new Link('', '#DDDDDD'), this.newNode(targetAction, 'action', actionBuiltNode.node));
                    this.seenActionNodes.push({id: targetAction.id, node: tabn.endNode.node})
                    this.addActionConditions(builder, targetAction, tabn.endNode);
                }
        });
    }   

    private static newNode(bu: BaseUnit, type: BuType, parentNode: Node) {
        const lkp = ProjectToCanvasGraph.ColorLkp[type];        
        const parentBu = parentNode.properties?.selectedUnit?.baseUnit;
        if (parentBu !== undefined) {
            bu.pathToRoot = [... (parentBu as BaseUnit).pathToRoot, bu];
        } else {
            bu.pathToRoot = [bu] ;
        }        
        return new Node(bu.name, lkp.backColor, lkp.textColor, {selectedUnit: new SelectedUnit(bu, type)}, bu.id );
    }
}

```

## Code scaffolding

Run `ng generate component component-name --project ngx-canvas-graph` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project ngx-canvas-graph`.
> Note: Don't forget to add `--project ngx-canvas-graph` or else it will be added to the default project in your `angular.json` file. 

## Build

Run `ng build ngx-canvas-graph` to build the project. The build artifacts will be stored in the `dist/` directory.

## Publishing

After building your library with `ng build ngx-canvas-graph`, go to the dist folder `cd dist/ngx-canvas-graph` and run `npm publish`.

## Running unit tests

Run `ng test ngx-canvas-graph` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## publishing

```
ng build @dendrityc/ngx-canvas-graph
cd dist//dendrityc/ngx-canvas-graph/
npm publish --access public
cd ../../..

```
