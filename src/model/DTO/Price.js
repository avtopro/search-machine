export default class Price {
    constructor(price) {
        this.amount = (price && price.Amount) || 0;
        this.currency = new Currency({
            Code: 'USD',
            Symbol: '$'
        });
        //new Currency(currency);
    }

    toString() {
        return `${this.currency.symbol} ${this.amount}`;
    }

    valueOf() {
        return this.amount;
    }
}

class Currency {
    constructor({ Code, Symbol }) {
        this.code = Code;
        this.symbol = Symbol;
    }

    toString() {
        return this.symbol;
    }

    valueOf() {
        return this.code;
    }
}
