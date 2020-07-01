import Category from './Category';
import Image from './Image';

export default class Crossgroup {
    constructor({ Id, Category: category, Specification, Images }) {
        this.id = Id;
        this.category = new Category(category);
        this.specification = Specification;
        // TODO: убрать это поле, если мы не будем получать фото комплектаций
        this.images = (Images || []).map(img => new Image(img));
    }

    toString() {
        return this.specification || 'Standard equipment';
    }

    valueOf() {
        return this.id;
    }
}
