import { IExtendedEdge, IExtendedNode } from "./graph-data";

export interface ILinkCustomPreDraw {
    extEdge: IExtendedEdge;
    ctx: CanvasRenderingContext2D;
    skipDefaultDraw: boolean;
}

export interface ILinkCustomPostDraw {
    extEdge: IExtendedEdge;
    ctx: CanvasRenderingContext2D;
}

export interface INodeCustomPreDraw {
    extNode: dagre.Node<IExtendedNode>;
    ctx: CanvasRenderingContext2D;
    skipDefaultDraw: boolean;
}

export interface INodeCustomPostDraw {
    extNode: dagre.Node<IExtendedNode>;
    ctx: CanvasRenderingContext2D;
}

export interface ICustomClear {
    ctx: CanvasRenderingContext2D;
}