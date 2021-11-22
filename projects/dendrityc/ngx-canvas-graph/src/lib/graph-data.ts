import { Link } from "./link";
import { Node } from "./node";

export class GraphData {
    nodes: Node[] = [];
    links: Link[] = [];
}

export interface IExtendedNode {
    source: Node;
}
  
export interface IExtendedEdge {
    start: dagre.Node;
    end: dagre.Node;
    startCenter: {x: number, y: number};
    endCenter:   {x: number, y: number};
    link: Link;
    points: IPoint[]
}

export interface IPoint {
    x: number; 
    y: number;
  }