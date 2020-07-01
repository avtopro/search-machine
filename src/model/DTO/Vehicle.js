import Model from './Model';
import Image from './Image';

export default class Vehicle {
    constructor({ Model: VehicleModel, EngineId, Photos }) {
        this.model = new Model(VehicleModel, () => EngineId);
        this.engineId = EngineId || 0; // 0 блокирует копирование EngineId из контекста
        this.images = Photos.map((i) => new Image(i));
    }

    get engine() {
        return this.model.engines.find((e) => e.id === this.engineId);
    }

    toString() {
        return this.model.toLongString();
    }

    valueOf() {
        return this.model.id;
    }
}
