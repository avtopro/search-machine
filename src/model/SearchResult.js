import {
    Region,
    Make,
    Model,
    Vehicle,
    Engine,
    Part,
    Category,
    CategoriesTree,
    Applicability
} from './DTO';

/**
 * Класс объектов для передачи в запросе к API поиска
 */
class SearchQuery {
    /**
     * @param {Object} obj
     */
    constructor({
        region,
        make,
        model,
        engineId,
        category,
        crossgroupId,
        brandName,
        partNumber,
        query
    }) {
        var ensure = (obj) => (obj == null ? {} : obj);
        this.Query = query;
        this.RegionId = ensure(region).id;
        this.MakeId = ensure(make).id;
        this.ModelId = ensure(model).id;
        this.EngineId = engineId;
        this.CategoryId = ensure(category).id;
        this.CrossgroupId = crossgroupId;
        this.PartNumber = partNumber;
        this.BrandName = brandName;
    }

    toJSON() {
        return Object.keys(this)
            .filter((k) => this[k] || k == 'Query')
            .reduce((obj, k) => {
                obj[k] = this[k];
                return obj;
            }, {});
    }

    /**
     * @returns {string} представление объекта в виде строки запроса с параметрами
     */
    toString() {
        return (
            '?' +
            Object.keys(this.toJSON())
                .map((key) => key + '=' + encodeURIComponent(this[key]))
                .join('&')
        );
    }
}

/**
 * Контекст содержит данные для однозначного определения состояния поиска
 * С каждым элементом поиска, способным влиять на результат, связан свой объект контекста,
 * или наследующий от него объект, который передаётся в поисковый движок при активации элемента
 */
class SearchContext {
    constructor(
        region,
        foundMake,
        foundModel,
        engineId,
        resultEngineId,
        foundCategory,
        foundPart,
        partNumber,
        brandName,
        applicabilities = [],
        vehicleCategoriesTree,
        crossgroupId,
        resultCrossgroupId,
        suggestionType,
        isAnythingFound,
        query,
        feedUri,
        foundVehicle
    ) {
        var make = foundMake && foundMake.Make;
        var category = foundCategory && foundCategory.Category;
        var part = foundPart && foundPart.Part;

        this.feedUri = feedUri || '';
        this.query = query || '';
        this.isAnythingFound = isAnythingFound;

        this.region = region && new Region(region);
        this.make = make && new Make(make);

        if (foundModel && foundModel.Model) {
            this.model = new Model(foundModel.Model, () => engineId);
        } else if (foundVehicle && foundVehicle.Vehicle) {
            const vehicleEngineId = foundVehicle.Vehicle.EngineId;
            this.model = new Model(
                foundVehicle.Vehicle.Model,
                () => engineId || vehicleEngineId
            );
        } else {
            this.model = null;
        }

        this.engineId = engineId;
        this.resultEngineId = resultEngineId;
        this.category = category && new Category(category);
        this.vehicleCategoriesTree =
            vehicleCategoriesTree && new CategoriesTree(vehicleCategoriesTree);
        this.partData = part && new Part(part, foundPart.Description);
        this.partNumber =
            partNumber || (this.partData ? this.partData.shortNr : null);
        this.brandName =
            brandName || (this.partData ? this.partData.brand.name : null);
        // TODO: получать пустые массивы, а не null
        this.applicabilities = (applicabilities || []).map(
            (ap) => new Applicability(ap)
        );
        this.crossgroupId = crossgroupId;
        this.resultCrossgroupId = resultCrossgroupId;
        this.suggestionType = suggestionType;
    }

    get regions() {
        // Поиск работает только по региону 1 - Европа, и 2 - Америка
        if (this.make) {
            return this.make.regions.filter((r) => r.id == 1 || r.id == 2);
        } else return [new Region({ Id: 1 }), new Region({ Id: 2 })];
    }

    /**
     * Возвращает выбранную комплектацию, или комплектацию по умолчанию
     */
    get applicability() {
        var crossgroupId = this.crossgroupId || this.resultCrossgroupId;
        return this.applicabilities.filter(
            (ap) => ap.crossgroup.id == crossgroupId
        )[0]; // || this.applicabilities[0];
    }

    /**
     * Устанавливает выбранную пользователем комплектацию
     */
    set applicability(value) {
        this.crossgroupId = value ? value.crossgroup.id : null;
    }

    /**
     * Возвращает выбранный двигатель, или двигатель по умолчанию
     */
    get engine() {
        var model = this.model;
        var engineId = this.engineId || this.resultEngineId;
        return (
            (model && model.engines.filter((e) => e.id == engineId)[0]) || null
        );
    }

    /**
     * Устанавливает выбранный пользователем двигатель
     */
    set engine(value) {
        this.engineId = value ? value.id : null;
    }

    get categories() {
        return this.vehicleCategoriesTree
            ? this.vehicleCategoriesTree.categories
            : [];
    }

    /**
     * Возвращает подсказки по результатам поиска
     */
    get suggestions() {
        return this._suggestions || [];
    }

    /**
     * Возвращает информацию о запчасти
     */
    get part() {
        return this.partData;
    }

    /**
     * Устанавливает новую запчасть и сбрасывает зависящие от старой запчасти поля
     */
    set part(value) {
        this.partData = value;
        this.partNumber = null;
        this.brandName = null;
    }

    /**
     * Возвращает подсказки без проблем совместимости с текущим контекстом
     */
    get compatibleSuggestions() {
        if (this.checkSuggestionCompatibility) {
            return this.suggestions.filter((s) =>
                this.checkSuggestionCompatibility(s)
            );
        } else return this.suggestions;
    }

    /**
     * Возвращает подсказки по непроверенным результатам
     */
    get incompatibleSuggestions() {
        if (this.checkSuggestionCompatibility) {
            return this.suggestions.filter(
                (s) => !this.checkSuggestionCompatibility(s)
            );
        } else return this.suggestions;
    }

    /**
     * Возвращает ссылку на выдачу
     */
    get uri() {
        // В контексте указана ссылка на выдачу (обычно такой контекст привязан к подсказке поиска)
        if (this.feedUri) {
            return this.feedUri;
        }
        // Если явно выбрана комплектация, из неё можно взять ссылку на соотв. выдачу
        // Но только если явно! Если брать ссылку из комплектации по умолчанию, будут лишние перезагрузки
        // страниц, в адресе которых не указан параметр cross
        if (this.crossgroupId) {
            let apl = this.applicability;
            // Внимание! Может быть такое, что при указанном CrossgroupId применимостей нет!
            return apl ? apl.uri : '';
        } else {
            return '';
        }
        // Больше нет необходимости формировать ссылку вручную, т. к. у applicabilities появилось поле uri
        // TODO: проверить, удалить
        /*
        else {
            let params = {
                type: this.engineId,
                cross: this.crossgroupId
            }
            let query = Object.keys(params).filter(p => params[p]).map(p => p + '=' + encodeURIComponent(params[p])).join('&');

            return query ? '?' + query : '';
        }
        */
    }

    /**
     * Присваивает новое значение указанному свойству и возвращает объект
     * Создан для удобства использования в цепочках вызовов
     */
    set(name, value) {
        this[name] = value;
        return this;
    }

    /**
     * Добавляет подсказки в контекст
     * Может использоваться, когда подсказки получены из другого источника,
     * нежели API поиска, например, автомобили из гаража,
     * и они должны быть вставлены в текущий контекст
     * @param {SearchContext[]} suggestions
     */
    setSuggestions(suggestions, suggestionType = '') {
        this._suggestions = suggestions.map((s) => this.seed(s));
        if (suggestionType) this.suggestionType = suggestionType;
        return this;
    }

    /**
     * Заполняет пустые свойства целевого объекта данными из текущего
     * @param {SearchContext} target
     * @param {boolean} [deep] - наполнять suggestions целевого объекта
     * @returns {SearchContext} target
     */
    seed(target, deep = false) {
        Object.keys(target).forEach((key) => {
            if (target[key] == null || target[key].length == 0) {
                target.set(key, this[key]);
            }
        });
        if (deep && target.suggestions.length > 0) {
            target._suggestions = target._suggestions.map((s) => this.seed(s));
        }
        return target;
    }

    /**
     * Заполняет пустые свойства текущего объекта данными из источника
     * @param {SearchContext} source
     * @returns {SearchContext}
     */
    hydrate(source) {
        Object.keys(source).forEach((key) => {
            if (this[key] == null || this[key].length == 0) {
                this.set(key, source[key]);
            }
        });
        return this;
    }

    /**
     * Обнуляет указанные свойства в новом возвращаемом объекте контекста
     * @param {...string} fields - названия обнуляемых свойств
     * @returns {SearchContext} - новый контекст
     */
    null(fields) {
        var ctx = this.seed(new this.constructor());
        for (let i = 0; i < arguments.length; i++) {
            ctx[arguments[i]] = null;
        }
        return ctx;
    }

    /**
     * Возвращает дубликат контекста
     * @param {boolean} [deep] - наполнять suggestions целевого объекта
     * @returns {SearchContext}
     */
    clone(deep = false) {
        // Использовать св-во constructor, чтобы создавать
        // дубликаты объектов, наследующих от SearchContext
        return this.seed(new this.constructor(), deep);
    }

    /**
     * Проверка контекста по условию "что-то выбрано"
     * @returns {boolean}
     */
    isEmpty() {
        return !(
            this.make ||
            this.category ||
            this.query ||
            this._tmpIsRegnumSearch
        );
    }

    /**
     * Проверка контекста по условию "основные параметры выбраны" (двигатель и комплектация второстепенные)
     * @returns {boolean}
     */
    isComplete() {
        return !!(this.model && this.part);
    }

    /**
     * Проверка контекста по условию "автомобиль уточнён до двигателя, или выбран из гаража"
     * @returns {boolean}
     */
    isCarComplete() {
        return !!(this.vehicle || this.engineId);
    }

    toQuery() {
        return new SearchQuery(this);
    }

    toJSON() {
        return this.toQuery().toJSON();
    }

    toString() {
        return this.uri;
    }
}

/**
 * Предложение поиска (другими словами - результат, подсказка)
 * Подсказка определённого типа, которую поиск предлагает по мере ввода данных пользователем
 * Представляет собой контекст, дополненный специфичными для подсказки полями
 */
class SearchSuggestion extends SearchContext {
    constructor(
        type,
        {
            Title,
            TitleBlocks,
            Uri,
            NextQueryString,
            FoundMake,
            FoundModel,
            FoundEngine,
            FoundCategory,
            FoundCrossgroupApplicability,
            FoundPart,
            FoundVehicle,
            PartFitsVehicle,
            PartFitsEngine
        } = {}
    ) {
        const make = FoundMake && FoundMake.Make;
        const model = FoundModel && FoundModel.Model;
        // Найденная модель может переопределять регион глобального контекста
        const modelRegion =
            make && model
                ? make.Regions.find(({ Id }) => Id == model.RegionId)
                : null;
        const engineId = FoundEngine ? FoundEngine.Engine.Id : null;
        const crossgroupId = FoundCrossgroupApplicability
            ? FoundCrossgroupApplicability.Applicability.Crossgroup.Id
            : null;
        super(
            modelRegion,
            FoundMake,
            FoundModel,
            engineId, // engineId
            null, // resultEngineId
            FoundCategory,
            FoundPart,
            null, // partNumber
            null, // brandName
            null, // applicabilities
            null, // vehicleCategoriesTree
            crossgroupId, // crossgroupId
            null, // resultCrossgroupId
            null, // suggestionType
            null, // isAnythingFound
            NextQueryString, // query
            Uri, // uri
            FoundVehicle
        );
        this.type = type;
        this.title = Title;
        this.titleBlocks = TitleBlocks;
        this.partFitsVehicle = PartFitsVehicle;
        this.partFitsEngine = PartFitsEngine;
    }

    toString() {
        return this.title;
    }
}

/**
 * Ответ API на поисковый запрос
 * Содержит новый контекст и массив предложений (подсказок)
 */
export default class SearchResult extends SearchContext {
    constructor({
        Region,
        Make,
        Model,
        EngineId,
        ResultEngineId,
        Category,
        Applicability,
        VehicleCategoriesTree,
        CrossgroupId,
        ResultCrossgroupId,
        Part,
        PartNumber,
        BrandName,
        PartFitsVehicle,
        Suggestions = [],
        SuggestionType,
        IsAnythingFound,
        FeedUri
    } = {}) {
        super(
            Region,
            { Make: Make },
            { Model: Model },
            EngineId,
            ResultEngineId,
            { Category: Category },
            { Part: Part },
            PartNumber,
            BrandName,
            Applicability,
            VehicleCategoriesTree,
            CrossgroupId,
            ResultCrossgroupId,
            SuggestionType,
            IsAnythingFound
        );
        // В предложениях указаны не все данные, а только те, которые могут изменить
        // поэтому для создания полноценных контекстов необходимо наполнить предложения данными из результата
        switch (SuggestionType) {
            case 'Part':
                this._suggestions = Suggestions.map((s) =>
                    this.null('category').seed(
                        new SearchSuggestion(SuggestionType, s)
                    )
                );
                break;

            case 'Catalog':
                this._suggestions = Suggestions.map((s) =>
                    this.null('brandName', 'partNumber', 'crossgroupId').seed(
                        new SearchSuggestion(SuggestionType, s)
                    )
                );
                break;

            default:
                this._suggestions = Suggestions.map((s) =>
                    this.null('make', 'model', 'engine').seed(
                        new SearchSuggestion(SuggestionType, s)
                    )
                );
        }
        this.partFitsVehicle = PartFitsVehicle;
    }

    checkSuggestionCompatibility(s) {
        switch (this.suggestionType) {
            case 'Engine':
                return s.partFitsEngine != false;
            case 'Catalog':
                return s.partFitsVehicle != false && s.partFitsEngine != false;
            case 'Part':
                return s.part.crossgroupId != null;
            default:
                return true;
        }
    }
}

/**
 * Результат поиска с информацией об автомобиле,
 * заполненный из объекта Vehicle (обычно сохранённый в гараже автомобиль)
 */
export class RegnumSearchResult extends SearchContext {
    constructor(
        { SuggestionType = 'Model', Suggestions } = {
            Suggestions: []
        }
    ) {
        super();
        this.suggestionType = SuggestionType;
        this._suggestions = Suggestions.map((s) =>
            this.seed(new SearchSuggestion(SuggestionType, s))
        );
        this.partFitsVehicle = null;
        this.isAnythingFound = Suggestions.length > 0;
        this._tmpIsRegnumSearch = true;
    }

    checkSuggestionCompatibility(s) {
        switch (this.suggestionType) {
            case 'Model':
                return s.partFitsEngine != false;
            default:
                return true;
        }
    }
}

export class CatalogSearchResult extends SearchContext {
    constructor(context, categories) {
        super(...[, , , , , , , , , , categories]);
        this.hydrate(context);
    }
}

/**
 * Результат поиска с информацией об автомобиле,
 * заполненный из объекта Vehicle (обычно сохранённый в гараже автомобиль)
 */
export class VehicleSearchResult extends SearchContext {
    // TODO: передавать объект VehicleDTO
    // Это можно сделать только после унификации DTO поиска и глобальных
    constructor(context, vehicles) {
        super();
        this.hydrate(context);
        this.suggestionType = 'Vehicle';
        this._suggestions = vehicles
            .map((v) => {
                if (v) {
                    const vehicle = v.Vehicle;
                    const model = vehicle.Model;
                    const make = model.Make;
                    const region = make.Regions.find(
                        (r) => r.Id === model.RegionId
                    );
                    const engineId = vehicle.EngineId;

                    return this.seed(
                        new SearchContext(
                            region,
                            { Make: make },
                            { Model: model },
                            engineId,
                            engineId
                        )
                            .set('id', v.id)
                            .set('vehicle', new Vehicle(vehicle))
                    );
                }
                return null;
            })
            .filter((v) => v);
    }
}
