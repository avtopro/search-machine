export default class Region {
    constructor({ Id, Name }) {
        this.id = Id;
        this.name = Name;
    }

    get flag() {
        return (regions[this.id] && regions[this.id].flag) || '';
    }

    toString() {
        return (regions[this.id] && regions[this.id].name) || this.name || '';
    }

    valueOf() {
        return this.id;
    }
}

const regions = {
    1: {
        name: 'Europe',
        flag: 'eu'
    },
    2: {
        name: 'America',
        flag: 'us'
    },
    3: {
        name: 'Japan',
        flag: 'jp'
    }
};
