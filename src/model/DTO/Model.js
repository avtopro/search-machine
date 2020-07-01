import Make from './Make';
import Engine from './Engine';
import Image from './Image';

export default class Model {
    constructor(
        {
            Id,
            Name,
            RegionId,
            Make: makeObj,
            ModelGroup,
            Engines,
            BodyCodes,
            YearFrom,
            YearTo,
            Image: imageObj
        },
        getEngineId
    ) {
        this.id = Id;
        this.name = Name;
        this.nameOrig = ModelGroup ? ModelGroup.NameOrig : '';
        this.regionId = RegionId;
        this.make = new Make(makeObj);
        this.engines = Engines ? Engines.map((e) => new Engine(e)) : [];
        this.bodyCodes = BodyCodes;
        this.yearFrom = YearFrom;
        this.yearTo = YearTo;
        this.image = new Image(imageObj);

        // Для развёрнутого текстового описания модели необходимо знать выбранный двигатель
        // Конструктор контекста должен передать в конструктор модели ф-ю, возвращающую ID двигателя
        this._getEngineId = getEngineId;
    }

    get region() {
        return this.make.regions.filter((r) => r.id == this.regionId)[0];
    }

    /**
     * Альтернативное название модели, составленное с использованием
     * полного названия, заполненного экспертами.
     */
    get fullNameOrig() {
        if (this.nameOrig) {
            return `${this.make} ${this.nameOrig}`;
        } else {
            return `${this.make} ${this.name}`;
        }
    }

    toLongString() {
        var engineId = this._getEngineId && this._getEngineId();
        if (engineId) {
            return `${this.make} ${this.toString()}, ${this.engines
                .filter((e) => e.id == engineId)[0]
                .toString()}`;
        } else {
            return `${this.make} ${this.toString()}`;
        }
    }

    toString() {
        var years = this.yearTo
            ? `${this.yearFrom} - ${this.yearTo}`
            : `c ${this.yearFrom}`;
        return this.bodyCodes.length > 0
            ? `${this.name} (${this.bodyCodes.join(', ')}) (${years})`
            : `${this.name} (${years})`;
    }

    valueOf() {
        return this.id;
    }
}
