import Image from './Image';
import Region from './Region';

export default class Make {
    constructor({ Id, Name, Logo, Regions }) {
        this.id = Id;
        this.name = Name;
        this.image = new Image(Logo);
        this.regions = Regions ? Regions.map(r => new Region(r)) : [];
    }

    toString() {
        return this.name;
    }

    valueOf() {
        return this.id;
    }
}
