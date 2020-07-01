import { Machine, assign, actions, spawn } from 'xstate';
import {
    parseSearchResult,
    fetchSearchResult,
    fetchCatalog,
    fetchGarage
} from '../services/SearchService';
import searchMachine, { EVENTS } from './searchMachine';

const { log, pure, send } = actions;

const initFetchMachine = (initialResult) => {
    const result = parseSearchResult(initialResult);

    return Machine({
        context: {
            result,
            controller: null
        },
        entry: assign({
            controller: () =>
                spawn(searchMachine.withContext(result.toQuery()), {
                    sync: true
                    // autoForward: true
                })
        }),
        on: {
            '*': {
                actions: pure((context, event) => {
                    const isForwarding = EVENTS.includes(
                        event.type.split('.')[0]
                    );

                    if (isForwarding)
                        return send((context, event) => event, {
                            to: (context) => context.controller
                        });

                    return undefined;
                })
            }
        },
        initial: 'idle',
        states: {
            idle: {
                on: {
                    'FETCH.search': 'busy',
                    'FETCH.garage': 'busy',
                    'FETCH.catalog': 'busy'
                }
            },
            busy: {
                invoke: {
                    id: 'request',
                    src: ({ result }, { type, query, mode }) => {
                        switch (type) {
                            case 'FETCH.search':
                                return fetchSearchResult(query, mode);
                            case 'FETCH.garage':
                                return fetchGarage(result);
                            case 'FETCH.catalog':
                                return fetchCatalog(result, query);
                            default:
                                return null;
                        }
                    },
                    onDone: {
                        target: 'idle',
                        actions: assign({
                            result: (context, event) => event.data
                        })
                    },
                    onError: {
                        target: 'idle',
                        actions: pure(({ controller }) => {
                            controller.stop();
                            controller.start(controller.state.history);
                            return log();
                        })
                    }
                }
            }
        },
        actions: {
            log: log()
        }
    });
};

export default initFetchMachine;
