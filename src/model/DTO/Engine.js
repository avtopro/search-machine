export default class Engine {
    constructor({
        Id,
        Name,
        Code,
        DriveType: driveType,
        EngineType: engineType,
        FuelType: fuelType,
        Displacement,
        PowHP,
        PowKW
    }) {
        this.id = Id;
        this.name = Name;
        this.code = Code;
        this.driveType = new DriveType(driveType);
        this.engineType = new EngineType(engineType);
        this.fuelType = new FuelType(fuelType);
        this.displacement = Displacement;
        this.powHP = PowHP;
        this.powKW = PowKW;
    }

    get fullName() {
        var pow = [
            this.powKW ? `${this.powKW} ${'kW'}` : '',
            this.powHP ? `${this.powHP} ${'h.p.'}` : ''
        ]
            .filter(s => s)
            .join(' ');

        if (this.name || this.code) {
            return [this.name, this.code, pow].filter(s => s).join(' ');
        } else {
            return `Engine ${this.id} (no data)`;
        }
    }

    get description() {
        var displacement = this.displacement
            ? `${this.displacement} ${'l'}`
            : '';
        var engineType = this.engineType.toString();
        var driveType = this.driveType.toString();

        // Полное описание будет выглядеть как "бензин 2 л, задний привод"
        if (this.displacement || this.engineType) {
            return [(engineType + ' ' + displacement).trim(), driveType]
                .filter(s => s)
                .join(', ');
        } else return '';
    }

    toString() {
        return [this.name, this.engineType.toString()].filter(s => s).join(' ');
    }

    valueOf() {
        return this.id;
    }
}

class DriveType {
    constructor(type) {
        this.id = type && type.Id;
        this.name = type && type.Name;
    }

    toString() {
        switch (this.name) {
            case 'front':
            case 'Передний':
                return 'front drive';

            case 'rear':
            case 'Задний':
                return 'rear drive';

            case 'all':
            case 'Полный':
                return 'four-wheel drive';

            default:
                return this.name || '';
        }
    }

    valueOf() {
        return this.id;
    }
}

class EngineType {
    constructor(type) {
        this.id = type && type.Id;
        this.name = type && type.Name;
    }

    toString() {
        switch (this.name) {
            case 'gas':
                return 'gasoline';

            case 'diesel':
                return 'diesel';

            case 'electrical':
                return 'electrical';

            default:
                return this.name || '';
        }
    }

    valueOf() {
        return this.id;
    }
}

class FuelType {
    constructor(type) {
        this.id = type && type.Id;
        this.name = type && type.Name;
    }

    toString() {
        return this.name || '';
    }

    valueOf() {
        return this.id;
    }
}
