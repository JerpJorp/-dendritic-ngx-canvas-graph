
import { GraphData } from "./graph-data";
import { Link } from "./link";
import { Node } from "./node";

// traverses nodes/links and only filters out descendents of collapsed nodes
export class ExpansionModifier {

    uncollapsedGraphData: GraphData;

    constructor(public graphData: GraphData, collapseAtDepth: number) {
        this.setInternalDepth(this.graphData.nodes[0]);
        this.setDepthCollapse(collapseAtDepth);
        this.uncollapsedGraphData = {nodes: [], links: []};
        this.addToUncollapsed(this.graphData.nodes[0]);
    }

    setDepthCollapse(collapseAtDepth: number) {
        this.graphData.nodes.filter(node => node.internalDepth >= collapseAtDepth).forEach(node => {
            if (node.internalDisplayState === 'expanded') {
                node.internalDisplayState = 'collapsed';
            }
        });
    }

    setInternalDepth(node: Node | undefined, level = 0, seenNodeIds: string[] = []) {
        if (node) {
            node.internalDepth = level;
            seenNodeIds.push(node.id);

            const children = this._children(node).filter(child => !seenNodeIds.find(seen => seen === child.targetNode.id));
            children.forEach(child => this.setInternalDepth(child.targetNode,  level + 1, seenNodeIds));
            if (children.length === 0) {
                node.internalDisplayState = 'last';
            }
        }
    }

    addToUncollapsed(node: Node | undefined, seenNodeIds: string[] = []) {
        if (node) {
            seenNodeIds.push(node.id);
            this.uncollapsedGraphData.nodes.push(node);
            if (node.internalDisplayState !== 'collapsed') {
                const children = this._children(node);
                this.uncollapsedGraphData.links.push(... children.map(x => x.link));
                children
                    .filter(child => !seenNodeIds.find(seen => seen === child.targetNode.id))
                    .forEach(child => this.addToUncollapsed(child.targetNode, seenNodeIds));
            }
        }
    }

    _children(node: Node): {link: Link, targetNode: Node}[] {
       return this.graphData.links
            .filter(link => link.fromNodeId === node.id)
            .map(link => ({link: link, targetNode: this.graphData.nodes.find(node => node.id === link.toNodeId)}))
            .filter(x => x.targetNode !== undefined) as {link: Link, targetNode: Node}[];
    }
    
    // called by client when user collapses a node
    ToggleCollapse(node: Node, cascade: boolean): boolean {
        if (node.internalDisplayState !== 'last') {
            this._setInternalDisplayState(node, node.internalDisplayState === 'expanded' ? 'collapsed' : 'expanded', cascade);
            this.uncollapsedGraphData = {nodes: [], links: []};
            this.addToUncollapsed(this.graphData.nodes[0]);
            return true;
        } else {
            return false;
        }        
    }

    _setInternalDisplayState(node: Node, internalDisplayState: 'collapsed' | 'expanded', cascade: boolean) {
        node.internalDisplayState =internalDisplayState;
        if (cascade) {
            this._children(node)
                .filter(child => child.targetNode.internalDisplayState !== 'last')
                .forEach(child => this._setInternalDisplayState(child.targetNode, internalDisplayState, cascade))
        }

    }
}

export class ArrangedNode {

    state: 'collapsed' | 'expanded' | 'last' = 'expanded';

    children: ArrangedNode[] = [];
    constructor(public node: Node) {}

    static Factory(graphData: GraphData): ArrangedNode | undefined {

        if (graphData.nodes.length === 0) {
            return undefined;
        } else {
            const seenNodeIds: string[] = [];
            const root = new ArrangedNode(graphData.nodes[0]);
            seenNodeIds.push(root.node.id);
            this.AddChildren(root, graphData, seenNodeIds);
            return root;
        }        
    }

    static processArrangedNode() {


    }
    static AddChildren(parent: ArrangedNode, graphData: GraphData, seenNodeIds: string[]) {
        
        parent.children = graphData.links
            .filter(link => link.fromNodeId === parent.node.id)
            .map(link => graphData.nodes.find(node => node.id === link.toNodeId))
            .filter(toNode => toNode !== undefined)
            .map(toNode => new ArrangedNode(toNode as Node));

        const firstTime = parent.children.filter(child => seenNodeIds.find(x => x === child.node.id) === undefined);
        firstTime.forEach(child => {            
            seenNodeIds.push(child.node.id);
            this.AddChildren(child, graphData, seenNodeIds)
        })
    }
}