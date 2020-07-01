import { Machine, assign, actions, sendParent } from 'xstate';
import { searchModes } from '../services/SearchService';

const { pure } = actions;

/**
 * Action creator для события загрузки результатов поиска
 * @param {string} [mode] - режим поиска
 */
const fetchSearch = (mode) =>
    pure((context) =>
        sendParent({ type: 'FETCH.search', mode: mode || '', query: context })
    );

/**
 * Action creator для события загрузки гаража
 */
const fetchGarage = () => pure(() => sendParent({ type: 'FETCH.garage' }));

/**
 * Action creator для события загрузки дерева каталога
 */
const fetchCatalog = () =>
    pure((context) => sendParent({ type: 'FETCH.catalog', query: context }));

/**
 * Типы сообщений, которые searchMachine ожидает получить извне
 */
export const EVENTS = ['GET', 'SET', 'ASK', 'SKIP'];

const searchMachine = Machine(
    {
        context: {
            RegionId: 0,
            MakeId: 0,
            ModelId: 0,
            EngineId: 0,
            CategoryId: 0,
            PartNumber: '',
            BrandName: '',
            Query: ''
        },
        initial: 'init',
        on: {
            ASK: {
                target: 'search.indefinite',
                actions: 'setContext',
                // Переход должен быть внешним, чтобы корректно
                // работали запросы в состоянии indefinite
                internal: false
            },
            GET: { target: 'search.definite' },
            'GET.make': {
                target: '#routine.make'
            },
            'GET.model': {
                target: '#routine.model',
                cond: 'isMakeSpecified'
            },
            'GET.engine': {
                target: '#routine.engine',
                cond: 'isModelSpecified'
            },
            'GET.category': { target: '#routine.category.lastVisited' }
        },
        states: {
            // Начальное состояние служит для выбора между
            // режимом выдачи (когда данные о запчасти известны заранее) и режимом поиска
            init: {
                on: {
                    '': [
                        {
                            target: '#feed.view',
                            cond: 'isPartSpecifiedCode'
                        },
                        {
                            target: 'search'
                        }
                    ]
                }
            },
            // Режим поиска имеет два состояния:
            // определённое, когда пользователь идёт по шагам выбора автомобиля и категории
            // и неопределённое, когда пользователь вводит запрос в поисковую строку
            search: {
                id: 'search',
                initial: 'definite',
                states: {
                    // В неопределённом состоянии загружаются подсказки, соответствующие запросу,
                    // после чего, в зависимости от типа полученных подсказок, пользователь
                    // может перейти в выдачу (поиск по коду), или вернуться в определённое состояние
                    indefinite: {
                        entry: fetchSearch(),
                        on: {
                            SET: [
                                {
                                    target: '#feed',
                                    cond: 'isPartSpecifiedCode',
                                    actions: 'setContext'
                                },
                                {
                                    target: 'definite',
                                    actions: 'setContext'
                                }
                            ]
                        }
                    },
                    // Определённое состояние начинается с выбора марки и завершается
                    // выбором категории, после чего пользователь переходит в выдачу по каталогу
                    definite: {
                        initial: 'router',
                        states: {
                            // Шаги уточнения автомобиля и категории проходят через состояние router,
                            // в котором на основании заполненных данных определяется следующий шаг
                            router: {
                                id: 'router',
                                on: {
                                    '': [
                                        // Router будет требовать уточнения автомобиля, включая двигатель, и запчасти,
                                        // и только при наличии всех данных отправит пользоватея в выдачу
                                        // Есть более короткие пути перехода в выдачу, они прописаны
                                        // в специфичных состояниях поиска, минуя router
                                        {
                                            target: '#feed',
                                            cond: {
                                                type: 'isPartSpecifiedCatalog',
                                                strict: true
                                            }
                                        },
                                        {
                                            target: 'routine.category',
                                            cond: 'isVehicleSpecified'
                                        },
                                        {
                                            target: 'routine.engine',
                                            cond: 'isModelSpecified'
                                        },
                                        {
                                            target: 'routine.model',
                                            cond: 'isMakeSpecified'
                                        },
                                        {
                                            target: 'routine.make'
                                        }
                                    ]
                                }
                            },
                            routine: {
                                id: 'routine',
                                initial: 'make',
                                states: {
                                    // Выбор марки автомобиля
                                    // Из этого состояния возможен переход в гараж
                                    make: {
                                        entry: fetchSearch(searchModes.MAKE),
                                        on: {
                                            SET: {
                                                target: '#router',
                                                actions: 'setContext'
                                            },
                                            'GET.garage': {
                                                target: 'garage'
                                            }
                                        }
                                    },
                                    // Выбор модели автомобиля
                                    model: {
                                        entry: fetchSearch(searchModes.MODEL),
                                        on: {
                                            SET: {
                                                target: '#router',
                                                actions: 'setContext'
                                            }
                                        }
                                    },
                                    // Выбор двигателя автомобиля
                                    // Из этого состояния можно перейти прямо в выдачу,
                                    // если запчасть известна (либо по коду, либо по категории и модели)
                                    // При этом выбор двигателя не обязателен и может быть пропущен
                                    engine: {
                                        entry: fetchSearch(searchModes.ENGINE),
                                        on: {
                                            SET: [
                                                // Прямой переход в выдачу по коду
                                                // Необходим для правильного уточнения автомобиля в выдаче
                                                // по нескроссированным кодам (у запчасти будет PartNumber и BrandName,
                                                // но не будет Crossgroup.Category и проверка isPartSpecifiedCatalog не пройдёт)
                                                {
                                                    target: '#feed',
                                                    cond: 'isPartSpecifiedCode',
                                                    actions: 'setContext'
                                                },
                                                // Установка двигателя ведёт пользователя к следующему шагу поиска
                                                {
                                                    target: '#router',
                                                    actions: 'setContext'
                                                }
                                            ],
                                            'SKIP.engine': [
                                                // Прямой переход в выдачу по каталогу,
                                                // который происходит при условии, что категория запчасти уже известна
                                                {
                                                    target: '#feed',
                                                    cond: {
                                                        type:
                                                            'isPartSpecifiedCatalog',
                                                        strict: false
                                                    }
                                                },
                                                // Прямой переход в выдачу по коду,
                                                // если автомобиль уточняется для уже найденной через поиск запчасти
                                                {
                                                    target: '#feed',
                                                    cond: 'isPartSpecifiedCode'
                                                },
                                                // В остальных случаях пропуск двигателя ведёт к выбору категории
                                                {
                                                    target: 'category'
                                                }
                                            ]
                                        }
                                    },
                                    // Выбор категории запчасти
                                    // После выбора запчасти можно перейти в выдачу по каталогу,
                                    // при условии что модель автомобиля уже известна
                                    // Если убрать переход в выдачу из категории, то получится сценарий,
                                    // в котором пользователя два раза просят уточнить двигатель:
                                    // сначала после выбора модели, а затем после выбора категории
                                    category: {
                                        initial: 'top',
                                        on: {
                                            SET: [
                                                {
                                                    target: '#feed',
                                                    cond: 'isModelSpecified',
                                                    actions: 'setContext'
                                                },
                                                {
                                                    target: '#router',
                                                    actions: 'setContext'
                                                }
                                            ]
                                        },
                                        // У категории есть три представления:
                                        // топ 12, дерево и полный список категорий,
                                        // из которых возможны перекрестные переходы
                                        // Последнее выбранное состояние запоминается
                                        // и становится начальным при следующих заходах
                                        states: {
                                            top: {
                                                entry: fetchSearch(
                                                    searchModes.CATALOG
                                                ),
                                                on: {
                                                    'GET.category.tree': 'tree',
                                                    'GET.category.list': 'list'
                                                }
                                            },
                                            tree: {
                                                entry: fetchCatalog(),
                                                on: {
                                                    'GET.category.top': 'top',
                                                    'GET.category.list': 'list'
                                                }
                                            },
                                            list: {
                                                entry: fetchCatalog(),
                                                on: {
                                                    'GET.category.top': 'top',
                                                    'GET.category.tree': 'tree'
                                                }
                                            },
                                            lastVisited: {
                                                type: 'history'
                                            }
                                        }
                                    },
                                    // Выбор автомобиля из гаража (и просмотренных автомобилей)
                                    garage: {
                                        entry: fetchGarage(),
                                        on: {
                                            SET: {
                                                target: '#router',
                                                actions: 'setContext'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            // Режим выдачи
            // Находясь здесь, пользователь видит полную информацию о найденной запчасти
            // При помощи глобальных событий ASK и GET пользователь может вернуться
            // в режим поиска и выбрать другую запчасть
            //
            // ВНИМАНИЕ! В режиме выдачи не работает событие SET, это предусмотренное поведение
            // Прежде, чем что-то изменить (SET), нужно перейти в состояние, где это возможно
            feed: {
                id: 'feed',
                initial: 'init',
                states: {
                    // Начальное состояние init служит для подгрузки данных о запчасти
                    // Если данные о запчасти известны и не должны загружаться повторно,
                    // то можно переходить прямо в состояние feed.view, минуя feed.init
                    init: {
                        entry: fetchSearch(),
                        on: {
                            '': 'view'
                        }
                    },
                    view: {}
                }
            }
        }
    },
    {
        actions: {
            setContext: assign((context, { type, ...eventData }) => {
                return {
                    ...context,
                    ...eventData
                };
            })
        },
        guards: {
            isVehicleSpecified: (context, event) => {
                const engineId = context.EngineId || event.EngineId;
                return Boolean(engineId);
            },
            isModelSpecified: (context, event) => {
                const modelId = context.ModelId || event.ModelId;
                return Boolean(modelId);
            },
            isMakeSpecified: (context, event) => {
                const makeId = context.MakeId || event.MakeId;
                return Boolean(makeId);
            },
            isPartSpecifiedCatalog: (context, event, { cond }) => {
                const modelId = context.ModelId || event.ModelId;
                const engineId = context.EngineId || event.EngineId;
                const categoryId = context.CategoryId || event.CategoryId;
                return cond.strict
                    ? Boolean(engineId && categoryId)
                    : Boolean(modelId && categoryId);
            },
            isPartSpecifiedCode: (context, event) => {
                const partNumber = context.PartNumber || event.PartNumber;
                const brandName = context.BrandName || event.BrandName;
                return Boolean(partNumber && brandName);
            }
        }
    }
);

export default searchMachine;
