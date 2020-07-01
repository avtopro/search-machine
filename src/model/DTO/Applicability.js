import Crossgroup from './Crossgroup';
import Price from './Price';

export default class Applicability {
    constructor({
        Applicability,
        CompatibleEngineIds,
        SellersCount,
        PriceMin,
        PriceMax,
        Uri
    }) {
        this.specification = Applicability.Specification;
        this.crossgroup = new Crossgroup(Applicability.Crossgroup);
        this.compatibleEngineIds = CompatibleEngineIds;
        this.sellersCount = SellersCount;
        this.priceMin = new Price(PriceMin);
        this.priceMax = new Price(PriceMax);
        this.images = this.crossgroup.images;
        this.uri = Uri;
    }

    toString() {
        var specs = [this.crossgroup.specification, this.specification]
            .filter(s => s)
            .join(', ');
        return specs || this.crossgroup.toString();
    }

    valueOf() {
        return this.id;
    }

    isCompatibleWithEngine(id) {
        return this.compatibleEngineIds.some(_id => _id == id);
    }
}
