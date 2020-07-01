import SearchResult, {
    VehicleSearchResult,
    CatalogSearchResult
} from '../model/SearchResult';

/**
 * Доступные режимы поиска
 */
export const searchModes = {
    MAKE: 'Make',
    MODEL: 'Model',
    ENGINE: 'Engine',
    CATALOG: 'Catalog'
};

/**
 * Преобразует "сырой" объект ответа в SearchResult
 * @param {object} result
 * @returns {SearchResult}
 */
export const parseSearchResult = (result) =>
    result ? new SearchResult(result) : new SearchResult();

/**
 * Загружает результаты поиска
 * @param {object} query
 * @param {string} mode
 * @returns {SearchResult}
 */
export const fetchSearchResult = (query, mode) => {
    const requestParams = Object.keys(query)
        .filter((k) => query[k] || k === 'Query')
        .reduce(
            (obj, k) => {
                obj[k] = query[k];
                return obj;
            },
            {
                SuggestionType: mode
            }
        );

    return fetch('https://localhost:44301/api/v1/search/query', {
        method: 'PUT',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestParams)
    })
        .then((response) => {
            return response.json();
        })
        .then((result) => new SearchResult(result));
};

/**
 * Загружает автомобили из гаража пользователя
 * Добавляет полученные данные в текущий контекст
 * @param {SearchResult} currentContext
 * @returns {VehicleSearchResult}
 */
export const fetchGarage = (currentContext) => {
    return fetch('https://localhost:44301/api/v1/garage/vehicles', {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then((response) => {
            return response.json();
        })
        .then((vehicles) => new VehicleSearchResult(currentContext, vehicles));
};

/**
 * Загружает дерево каталога
 * Добавляет полученные данные в текущий контекст
 * @param {SearchResult} currentContext
 * @param {object} query
 * @returns {CatalogSearchResult}
 */
export const fetchCatalog = (currentContext, query) => {
    const { ModelId, EngineId } = query;
    const queryString = `modelId=${ModelId || 0}&engineId=${EngineId || 0}`;

    return fetch(
        `https://localhost:44301/api/v1/search/catalog-tree?${queryString}`,
        {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            }
        }
    )
        .then((response) => {
            return response.json();
        })
        .then((vehicles) => new CatalogSearchResult(currentContext, vehicles));
};
