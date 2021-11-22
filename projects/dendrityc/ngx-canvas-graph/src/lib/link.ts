export class Link {

    fromNodeId: string | undefined;
    toNodeId: string | undefined;
    
    constructor(public displayText: string, 
        public lineColor?: string, 
        public bgColor?: string, 
        public textColor?: string, 
        public properties?: { [index: string]: any}) {
            
    }
}
