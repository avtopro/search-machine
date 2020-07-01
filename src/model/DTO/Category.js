import Image from './Image';
import Price from './Price';

export default class Category {
    /**
     *
     * @param {Object} Category
     * @param {number} Category.Id
     * @param {string} Category.Name
     * @param {string} [Category.Uri] - ссылка на выдачу, может быть заполнена только в дереве категорий модели
     * @param {Object} [Category.Image]
     * @param {Object} [PriceMin] - стоимость самой дешёвой запчасти в этой категории (not implemented)
     */
    constructor({ Id, Name, Uri, Image: image }, PriceMin) {
        this.id = Id;
        this.name = Name;
        this.uri = Uri;
        this.image = new Image(image);
        this.priceMin = new Price(PriceMin);
    }

    toString() {
        return this.name;
    }

    valueOf() {
        return this.id;
    }
}
