import * as uuid from 'uuid';

export class Node {
    id: string;
    // used by ngx-canvas graph for expansion/collapse.  Clients can set a node with children
    // to collapsed so it starts that way in the display.  Users can then toggle collapse/expand
    // tracked via this property to modify graph display
    internalDisplayState: 'collapsed' | 'expanded' | 'last' = 'expanded';
    internalDepth = -1;
    
    constructor(public displayText: string, 
        public backColor?: string, 
        public textColor?: string,
        public properties?: { [index: string]: any},
        id?: string) {
      
      this.id =  id ? id : 'id' + uuid.v4();

    }
}
