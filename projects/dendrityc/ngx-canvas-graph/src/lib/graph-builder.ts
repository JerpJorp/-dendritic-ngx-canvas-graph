import { GraphData } from "./graph-data";
import { Link } from "./link";
import { Node } from "./node";

export class GraphBuilder {

    graphData = new GraphData();

    constructor() {
        this.graphData.nodes = [];
        this.graphData.links = [];
    }

    AddNode(node: Node): BuiltNode {
        this.graphData.nodes.push(node);
        return new BuiltNode(this, node);
    }
}

export class BuiltNode {
    constructor(private builder: GraphBuilder, public node: Node) {}
    AddLinkTo(link: Link, toNode: Node): BuiltLink  {
        
        this.builder.graphData.nodes.push(toNode);
        link.fromNodeId = this.node.id;
        link.toNodeId = toNode.id;
        this.builder.graphData.links.push(link);
        return new BuiltLink(this.builder, link, new BuiltNode(this.builder, toNode));
    }
}

export class BuiltLink {
    constructor(private builder: GraphBuilder, public link: Link, public endNode: BuiltNode) {

    }
}