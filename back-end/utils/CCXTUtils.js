'use strict';

const ccxt = require('ccxt');
const Bottleneck = require('bottleneck');
const Exchange = require('../models').Exchange;
const util = require('util');
const {
    logAction
} = require('../utils/ActionLogUtil');

//connectors caches. same connectors but viewed through different keys
let con_by_id = {},
    con_by_api = {};
let lim_by_id = {},
    lim_by_api = {};

const cache_init_promise = Exchange.findAll({}).then(exchanges => {

    _.mapValues(EXCHANGE_KEYS, exchange_options => {
        exchange_options.timeout = 120000 // request timeout after 120 seconds
    });

    _.forEach(exchanges, exchange => {
        const connector = new ccxt[exchange.api_id](EXCHANGE_KEYS[exchange.api_id]);
        const throttle = {
            id: `LIM-${exchange.api_id}`,
            bottleneck: new Bottleneck({
                id: `bottleneck-${exchange.api_id}`,
                //request time multiplied when dealing with bitfinex due to strict limits policy
                // with a one request per 0.5 seconds policy bitfinex will use one per 3 sec
                minTime: exchange.api_id != 'bitfinex'? CONFIG.ccxt_request_mintime : (CONFIG.ccxt_request_mintime * 6),
                maxConcurrent: 1
            }),
            throttled: async (default_return, fn, ...args) => {
                const throttler = lim_by_api[exchange.api_id];
                //bind passed fn back to connector since CCXT uses `this.X` internally
                const bound_fn = fn.bind(connector);

                return throttler.bottleneck.schedule(() => {
                    if (process.env.NODE_ENV == 'dev') {
                        console.log(`Scheduling call to ${fn.name} on ${connector.name} for ${args}`)
                    }
                    return bound_fn(...args)
                }).catch((error) => {
                    //error instanceof Bottleneck.prototype.BottleneckError can used for bottleneck-speicific
                    //error handling
                    //for now any error is logged and default value is returned
                    console.error(`\x1b[41m[LIMITER ${throttler.id}]\x1b[0m ERROR: ${error? error.message : 'N\\A'}`);
                    logAction('universal.error', {
                        args: {
                            error: `[${throttler.id}-${fn.name}-${args}]: ${error.message}`
                        },
                        log_level: LOG_LEVELS.Error
                    });
                    return default_return;
                })
            }
        }
        registerEvents(throttle.bottleneck);

        lim_by_id[exchange.id] = throttle;
        lim_by_api[exchange.api_id] = throttle;

        con_by_id[exchange.id] = connector;
        con_by_api[exchange.api_id] = connector;
    });

    return Promise.all(_.map(con_by_id, (connector, id) => connector.load_markets()))
});


const from_exchange_data = async (map_id, map_api, exchange_data) => {

    //ensure cache loaded
    await cache_init_promise;

    //fetch data by parameter type

    //is numeric? JS has no good check, 
    //source: https://stackoverflow.com/a/16655847
    if (Number(parseFloat(exchange_data)) === exchange_data) {
        return map_id[exchange_data];
    }

    //is api_id string
    if (typeof exchange_data === 'string') {
        return map_api[exchange_data];
    }

    //is full object, try either cache
    if (typeof exchange_data === 'object') {
        let result = map_id[exchange_data.id];
        if (result == null) {
            result = map_api[exchange_data.api_id];
        }

        return result;
    }

    return null;
}

/**
 * Fetch the CCXT connector corresponding to supplied exchange data. The connector will have
 * associated markets (instruments) preloaded with data.
 * 
 * async to prevent race conditions while the connectors cache loads.
 * 
 * `exchange_data` - An identifying piece of exchange data, such as exchange id, exchange api_id or full exchange object 
 */
const getConnector = async (exchange_data) => {
    return await from_exchange_data(con_by_id, con_by_api, exchange_data);
};
module.exports.getConnector = getConnector;

/**
 * Fetch the request limiter corresponding to supplied exchange data. 
 * The limiter can have a ccxt method passed into its `throttled` method to limit the execution speed.
 * 
 * The signature is `throttled(default, fn, ...args)`, where `default` gets returned if an error occurs during request process
 * 
 * The limiter also exposes an `id` property with the value `LIM-<exchange_api_id>` and the underlying `Bottleneck(options)` instance as `bottleneck`
 * 
 * async to prevent race conditions while the connectors cache loads.
 * 
 * `exchange_data` - An identifying piece of exchange data, such as exchange id, exchange api_id or full exchange object 
 */
const getThrottle = async (exchange_data) => {
    return await from_exchange_data(lim_by_id, lim_by_api, exchange_data);
}
module.exports.getThrottle = getThrottle;


/**
 * Fetch all CCXT connectors currently in the cache, mapped to exchange id in DB. 
 * 
 * Optionally filtered to list of exchange ids provided
 * 
 * async to ensure loaded markets
 */
const allConnectors = async (exchange_ids = []) => {

    //await cache init
    await cache_init_promise;

    //return all connectors if no filter
    if (_.isNull(exchange_ids) || _.isEmpty(exchange_ids)) {
        return con_by_id
    } else {
        return _.pickBy(con_by_id, (con, id) => exchange_ids.includes(Number(id)))
    }
};
module.exports.allConnectors = allConnectors;



/**
 * Go through each limiter and add an error listener.
 * Currently, this will be only called if the job has an uncaught error (which they shouldn't). But in case one occurs, this will be called.
 * In case of clustering, Redis errors will go here.
 */
const registerEvents = async (...limiters) => {

    limiters.map(limiter => {
        limiter.on('error', error => {
            console.error(`\x1b[41m[LIMITER ${limiter.id}]\x1b[0m ERROR: ${error.message}`);
            logAction('universal.error', {
                args: {
                    error: error.message
                },
                log_level: LOG_LEVELS.Error
            });
        });
    });
}