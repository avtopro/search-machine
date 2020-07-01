export default class CategorySubgroup {
    constructor({ Id, Name, GroupId, CategoryIds }) {
        this.id = Id;
        this.name = Name;
        this.groupId = GroupId;
        this.categoryIds = CategoryIds;
    }

    toString() {
        return this.name;
    }

    valueOf() {
        return this.id;
    }
}
