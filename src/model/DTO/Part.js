import Crossgroup from './Crossgroup';
import Image from './Image';
import Price from './Price';

export default class Part {
    constructor(
        {
            FullNr,
            ShortNr,
            Brand: brand,
            Crossgroup: crossgroup,
            CrossgroupId,
            Parameters,
            Images
        },
        Description = '',
        SellersCount = 0,
        PriceMin = 0,
        PriceMax = 0
    ) {
        this.fullNr = FullNr;
        this.shortNr = ShortNr;
        this.brand = new Brand(brand);
        this.crossgroup = crossgroup ? new Crossgroup(crossgroup) : null;
        this.crossgroupId = CrossgroupId;
        this.parameters = (Parameters || []).map(p => new Parameter(p));
        this.sellersCount = SellersCount;
        this.description = Description;
        this.priceMin = new Price(PriceMin);
        this.priceMax = new Price(PriceMax);

        this._images = (Images || []).map(img => new Image(img));
    }

    get category() {
        return this.crossgroup && this.crossgroup.category;
    }

    get images() {
        // Нет фоток, но запчасть скроссирована - типовое фото категории
        if (this.hasPhoto == false && this.crossgroup) {
            // TODO: фотка категории может быть объектом с пустыми полями, нужно навести порядок
            let image = this.crossgroup.category.image;
            return image.uri ? [image] : [];
        }
        // Тут либо фотки есть, либо пустой массив
        return this._images;
    }

    get hasPhoto() {
        return this._images.length > 0;
    }

    toString() {
        return this.category
            ? `${
                  this.shortNr
              } ${this.brand.toString()} ${this.category.toString()}`
            : `${this.shortNr} ${this.brand.toString()}`;
    }

    valueOf() {
        return this.shortNr;
    }
}

class Brand {
    constructor({ Id, Link, Name }) {
        this.id = Id;
        this.link = Link;
        this.name = Name;
    }

    toString() {
        return this.name;
    }
}

class Parameter {
    constructor({ Parameter, DecimalVal, StringVal, BooleanVal } = {}) {
        this.id = Parameter.Id;
        this.name = Parameter.Name;
        this.type = Parameter.Type;
        this.units = Parameter.Units;
        this.value = arguments[0][this.type + 'Val'];
    }

    toString() {
        return this.value + (this.units ? ' ' + this.units : '');
    }
}
