export default class CategoryGroup {
    constructor({ Id, Name, SubGroupIds }) {
        this.id = Id;
        this.name = Name;
        this.subgroupIds = SubGroupIds;
    }

    toString() {
        return this.name;
    }

    valueOf() {
        return this.id;
    }
}
