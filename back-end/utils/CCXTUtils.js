'use strict';

const ccxt = require('ccxt');
const Exchange = require('../models').Exchange;

//connectors caches. same connectors but viewed through different keys
let con_by_id = {}, con_by_api = {};

const cache_init_promise = Exchange.findAll({}).then(exchanges => {

    const connectors = _.map(exchanges, exchange => {
        return [exchange.id, exchange.api_id, new ccxt[exchange.api_id](EXCHANGE_KEYS[exchange.api_id])];
    });

    _.forEach(connectors, ([id, api_id, connector]) => {

        con_by_id[id] = connector;
        con_by_api[api_id] = connector;
    });
});

/**
 * Fetch the CCXT connector corresponding to supplied exchange data.
 * 
 * Technically async to prevent race ocnditions while the cache initializes, 
 * but should realistically always be ready immediately.
 * @param exchange_data An identifying piece of exchange data, such as exchange id, exchange api_id or full exchange object 
 */
const getConnector = async (exchange_data) => {
    //ensure cache loaded
    await cache_init_promise;

    //fetch connector by parameter type

    //is numeric? JS has no good check, 
    //source: https://stackoverflow.com/a/16655847
    if (Number(parseFloat(exchange_data)) === exchange_data) {
        return con_by_id[exchange_data];
    }

    //is api_id string
    if (typeof exchange_data === 'string') {
        return con_by_api[exchange_data];
    }

    //is full object, try either cache
    if (typeof exchange_data === 'object') {
        let connector = con_by_id[exchange_data.id];
        if (connector == null) {
            connector = con_by_api[exchange_data.api_id];
        }

        return connector;
    }

    return null;
};
module.exports.getConnector = getConnector;