/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import PropTypes from 'prop-types';
import { interpret } from 'xstate';
import CatalogTree from './catalog-tree';
import CarIcon from './icons/CarIcon';
import ZoomIcon from './icons/ZoomIcon';

export default class Search extends React.Component {
    static propTypes = {
        /**
         * Конечный автомат, который отвечает за переходы
         * между состояниями и загрузку результатов поиска
         */
        fetchMachine: PropTypes.object.isRequired,
        /**
         * TMP: функция сброса приложения в начальное состояние
         */
        reset: PropTypes.func.isRequired
    };

    state = {
        // Текущее состояние внутренней поисковой машины
        machine: this.props.fetchMachine.initialState,
        // Результаты поиска (контекст поиска, по старой терминологии)
        context: this.props.fetchMachine.initialState.context,
        // Выполняется запрос?
        pending: false
    };

    service = interpret(this.props.fetchMachine).onTransition((state) => {
        const { result, controller } = state.context;
        const currentResult = this.state.context;
        const pending = state.matches('busy');

        // Имеет смысл обновлять компонент только тогда, когда загружены
        // новые результаты поиска
        // Если делать это при каждом сообщении о переходе в новое состояние,
        // то обновление компонентов будет происходить до того, как подгрузятся
        // результаты, а это противоречит дизайну
        // Пока идёт загрузка, мы остаёмся в старом состоянии и показываем прелоадер
        if (state.changed) {
            this.setState({
                pending
            });
        }
        if (result !== currentResult) {
            this.setState({
                machine: controller.state,
                context: result
            });
            console.log('Next events:', controller.state.nextEvents);
        }
    });

    componentDidMount() {
        this.service.start();
    }

    componentWillUnmount() {
        this.service.stop();
    }

    /**
     * Возвращает строковое представление состояния поисковой машины,
     * например "search.definite.routine.make"
     */
    get machineState() {
        const { machine } = this.state;
        const states = machine.toStrings();
        return states[states.length - 1];
    }

    /**
     * Возвращает массив возможных в текущем состоянии событий
     */
    get nextEvents() {
        const { machine } = this.state;
        return machine.nextEvents;
    }

    /**
     * Предикат возможности события в текущем состоянии
     * @param {string} type
     */
    isEventPossible(type) {
        const { machine } = this.state;
        return machine.nextEvents.includes(type);
    }

    /**
     * Предикат соответствия текущему состоянию
     * Проверяет совпадение строкового наименования с текущим состоянием
     * Для удобства можно использовать сокращённые названия состояний:
     * вместо "search.definite.routine.make" просто "*.make",
     * когда нужно проверить, находится ли поиск в состоянии выбора марки,
     * или "search.definite.*", "*.definite.*" для других целей
     * @param {string} stateName
     */
    isState(stateName) {
        if (stateName.includes('*')) {
            return this.machineState.includes(stateName.replace(/\*/g, ''));
        } else {
            return this.machineState === stateName;
        }
    }

    /**
     * Предикат события, приведшего к переходу в текущее состояние
     * @param {string} type
     */
    isEvent(type) {
        const { machine } = this.state;
        return machine.event.type === type;
    }

    /**
     * Обработчик поиска по query-строке
     */
    onSubmit = (e) => {
        e.preventDefault();
        const { value } = e.target.query;
        this.service.send('ASK', { Query: value });
    };

    /**
     * Обработчик изменения региона
     */
    onRegionChange = (e) => {
        this.service.send('SET', { RegionId: e.target.value });
    };

    /**
     * Обработчик выбора подсказки
     */
    onSuggestionClick = (e, s) => {
        e.preventDefault();
        this.service.send('SET', s.toQuery());
    };

    /**
     * Обработчик выбора категории
     * Необходим для выбора категорий через дерево, или полный список,
     * в которых категории не являются объектами типа SearchSuggestion
     */
    onCategoryClick = (e, category) => {
        e.preventDefault();
        this.service.send('SET', { CategoryId: category.id });
    };

    /**
     * Обработчик перехода между режимами поиска
     */
    onNavBtnClick = (e) => {
        e.preventDefault();
        const eventSubType = e.target.getAttribute('target');

        if (eventSubType) {
            this.service.send(`GET.${eventSubType}`);
        } else {
            this.service.send('GET');
        }
    };

    /**
     * Обработчик пропуска выбора двигателя
     */
    onEngineSkip = (e) => {
        e.preventDefault();
        this.service.send('SKIP.engine');
    };

    renderResultsList() {
        const {
            suggestionType,
            _suggestions: suggestions
        } = this.state.context;

        // У результатов поиска нет подходящего уникального ключа
        // TODO: подумать над его генерацией
        const suggestionKeyBase = Date.now();

        return (
            <ol className="search-app__results">
                {(suggestions || []).map((s, i) => (
                    <li key={suggestionKeyBase + i}>
                        <a
                            href={s.uri}
                            onClick={(e) => {
                                this.onSuggestionClick(e, s);
                            }}
                        >
                            {/* Проверка на тип не несёт функционального значения и нужна только для преобразования */}
                            {suggestionType === 'Vehicle'
                                ? s.vehicle.toString()
                                : s.toString()}
                        </a>{' '}
                        {/* Дополнительные элементы управления для опций двигателя */}
                        {this.isEventPossible('SKIP.engine') && i === 0 ? (
                            <>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        this.onSuggestionClick(e, s);
                                    }}
                                >
                                    Это мой двигатель
                                </a>
                                <a href="#" onClick={this.onEngineSkip}>
                                    Пропустить шаг
                                </a>
                            </>
                        ) : null}
                    </li>
                ))}
            </ol>
        );
    }

    renderCategoriesList() {
        const { category, vehicleCategoriesTree } = this.state.context;
        const suggestionKeyBase = Date.now();

        if (!vehicleCategoriesTree) return null;

        return (
            <ol className="search-app__results">
                {(vehicleCategoriesTree.categories || []).map((c, i) => (
                    <li key={suggestionKeyBase + i}>
                        <a
                            href={c.uri}
                            onClick={(e) => {
                                this.onCategoryClick(e, c);
                            }}
                        >
                            {category && category.id === c.id ? (
                                <b>{c.toString()}</b>
                            ) : (
                                c.toString()
                            )}
                        </a>
                    </li>
                ))}
            </ol>
        );
    }

    renderCategoriesTree() {
        const { category, vehicleCategoriesTree } = this.state.context;

        if (!vehicleCategoriesTree) return null;

        return (
            <div className="search-app__results-tree">
                <CatalogTree
                    activeCategory={category}
                    onCategoryClick={this.onCategoryClick}
                    vehicleCategoriesTree={vehicleCategoriesTree}
                />
            </div>
        );
    }

    render() {
        const { pending } = this.state;
        const {
            region,
            make,
            model,
            category,
            partData,
            engineId,
            suggestionType
        } = this.state.context;

        const engine =
            model && engineId
                ? model.engines.find((engine) => engine.id === engineId)
                : undefined;

        const renderResults = () => {
            if (this.isState('*.category.tree')) {
                return this.renderCategoriesTree();
            }
            if (this.isState('*.category.list')) {
                return this.renderCategoriesList();
            }
            return this.renderResultsList();
        };

        return (
            <>
                <div className="search-app__head">
                    <nav className="search-app__nav">
                        {/* Переход к поиску по шагам */}
                        <button
                            onClick={this.onNavBtnClick}
                            className="search-app__nav__car-btn"
                        >
                            <CarIcon />
                        </button>
                        {/* Переход к выбору марки */}
                        <button
                            target="make"
                            hidden={!make}
                            onClick={this.onNavBtnClick}
                        >
                            {(make || 'MAKE').toString()}
                        </button>
                        {/* Переход к выбору модели */}
                        <button
                            target="model"
                            hidden={!model}
                            onClick={this.onNavBtnClick}
                        >
                            {(model || 'MODEL').toString()}
                        </button>
                        {/* Переход к выбору двигателя */}
                        <button
                            target="engine"
                            hidden={!engine}
                            onClick={this.onNavBtnClick}
                        >
                            {(engine || 'ENGINE').toString()}
                        </button>
                    </nav>

                    <nav className="search-app__nav">
                        {/* Переход к выбору категории */}
                        <button target="category" onClick={this.onNavBtnClick}>
                            {(
                                partData ||
                                category ||
                                'Каталог товаров'
                            ).toString()}
                        </button>
                    </nav>

                    <form className="search-app__form" onSubmit={this.onSubmit}>
                        <input name="query" type="search" autoComplete="off" />
                        <button style={{ textDecoration: 'none' }}>
                            <ZoomIcon />
                        </button>
                        <button
                            type="button"
                            className="danger"
                            onClick={this.props.reset}
                            style={{ fontSize: 30 }}
                        >
                            &times;
                        </button>
                    </form>
                </div>

                <div className="search-app__state">
                    <div>
                        {'Search state: '}
                        <strong
                            className={
                                this.isState('feed.view') ? 'danger' : null
                            }
                        >
                            {this.machineState}
                        </strong>
                    </div>
                    <div>
                        {'Fetch state: '}
                        <strong>{pending ? 'loading' : 'idle'}</strong>
                    </div>
                    <div>
                        {'Suggestion type: '}
                        <strong>{suggestionType || ''}</strong>
                    </div>
                    {this.isState('*.make') ? (
                        <div>
                            {'Region: '}
                            <select
                                value={(region || 0).valueOf()}
                                onChange={this.onRegionChange}
                            >
                                <option value={1}>Europe</option>
                                <option value={2}>America</option>
                            </select>
                        </div>
                    ) : (
                        <div>
                            {'Region: '}
                            <strong>
                                {region ? region.toString() : 'undefined'}
                            </strong>
                        </div>
                    )}
                </div>

                {renderResults()}

                <nav className="search-app__foot search-app__nav">
                    {this.isEventPossible('GET.garage') ? (
                        <a
                            href="#"
                            target="garage"
                            onClick={this.onNavBtnClick}
                        >
                            Выбрать из гаража
                        </a>
                    ) : null}
                    {this.isEventPossible('GET.make') &&
                    this.isState('*.garage') ? (
                        <a href="#" target="make" onClick={this.onNavBtnClick}>
                            Все марки
                        </a>
                    ) : null}
                    {this.isEventPossible('GET.category.top') ? (
                        <a
                            href="#"
                            target="category.top"
                            onClick={this.onNavBtnClick}
                        >
                            Популярные
                        </a>
                    ) : null}
                    {this.isEventPossible('GET.category.tree') ? (
                        <a
                            href="#"
                            target="category.tree"
                            onClick={this.onNavBtnClick}
                        >
                            Дерево каталога
                        </a>
                    ) : null}
                    {this.isEventPossible('GET.category.list') ? (
                        <a
                            href="#"
                            target="category.list"
                            onClick={this.onNavBtnClick}
                        >
                            Все товары
                        </a>
                    ) : null}
                </nav>
            </>
        );
    }
}
