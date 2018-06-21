'use strict';


const RecipeRun = require('../models').RecipeRun;
const RecipeRunDetail = require('../models').RecipeRunDetail;
const RecipeOrderGroup = require('../models').RecipeOrderGroup;
const RecipeOrder = require('../models').RecipeOrder;
const Instrument = require('../models').Instrument;
const Asset = require('../models').Asset;
const InstrumentExchangeMapping = require('../models').InstrumentExchangeMapping;
const InstrumentMarketData = require('../models').InstrumentMarketData;
const CCXTUtils = require('../utils/CCXTUtils');


const sameAssets = (obj1, obj2) => {

    return (
        (obj1.transaction_asset_id == obj2.transaction_asset_id &&
            obj1.quote_asset_id == obj2.quote_asset_id) ||
        (obj1.quote_asset_id == obj2.transaction_asset_id &&
            obj1.transaction_asset_id == obj2.quote_asset_id)
    )
}

/**
 * Returns current available funds on exchanges of supplied identifiers.
 * data is returned in the format of
 * 
 * {
 *  [exchange_id]: {
 *    [asset_id]: [money],
 *    [asset_id]: [money],
 *  ...
 *  }
 * }
 * @param exchange_ids Identifiers of exchanges to get balance for. should be a list
 */
const fetch_exchange_deposits = async (exchange_ids) => {

    //fetch all connectors, in [exchange_id, connector] pairs
    return Promise.all(_.map(exchange_ids,
        exchange_id => Promise.all([
            Promise.resolve(exchange_id),
            CCXTUtils.getConnector(exchange_id)
        ]))).then(connectors => {

        //fetch balance for users on exchanges in pairs [exchange_id, balance_data]
        return Promise.all(_.map(connectors, connector_data => {
            const [exchange_id, connector] = connector_data;
            return Promise.all([
                Promise.resolve(exchange_id),
                connector.fetchBalance()
            ])
        }));
    }).then(balances_data => {
        //aprticipating asset symbols of deposits
        const deposit_symbols = _.flatMap(balances_data, balance_data => {
            const [exchange_id, balance] = balance_data;
            return Object.keys(balance.free);
        });

        //structure next promise into list of one element being same balances/exchanges pairs, 
        //second element beign all assets that have deposit in exchange
        return Promise.all([
            Promise.resolve(balances_data),
            Asset.findAll({
                where: {
                    symbol: deposit_symbols
                }
            })
        ]);
    }).then(ex_balance_assets => {

        const [balance_data, assets] = ex_balance_assets;
        const symbol_lookup = _.keyBy(assets, 'symbol');

        //finally, turn balances into a mapping of exchanges
        //where each key is exchange id and data is 
        //mapping of money amount for asset id
        return _.fromPairs(_.map(balance_data, ([exchange_id, balance_info]) => {
            const symbols = Object.keys(balance_info.free);
            const symbol_ids = _.map(symbols, s => symbol_lookup[s].id);
            const balances = _.map(symbols, s => balance_info.free[s]);

            //build up same mapping as balance.free, but with asset ids instead of symbols
            const asset_sum = _.zipObject(symbol_ids, balances);

            //associate mapping with exchanges
            return [exchange_id, asset_sum]
        }));
    });
}

const marketDataKeyForRunDetail = (market_data_keys, instruments_by_id, recipe_run_detail) => {

    return _.find(market_data_keys, key => {
        const [key_instrument_id, key_exchange_id] = key.split(",").map(str_id => parseInt(str_id, 10));
        return (
            key_exchange_id == recipe_run_detail.target_exchange_id &&
            sameAssets(instruments_by_id[key_instrument_id], recipe_run_detail)
        )
    });
}

const generateApproveRecipeOrders = async (recipe_run_id) => {

    //cehck if there already is a set of recipe orders for this recipe, by querying group
    const existing_group = await RecipeOrderGroup.findOne({
        where: {
            recipe_run_id: recipe_run_id
        }
    });
    if (existing_group) {
        TE(`Recipe run ${recipe_run_id} already has a generated orders group ${existing_group.id}, cant generate more!`);
    }

    const recipe_run = await RecipeRun.findById(recipe_run_id);

    if (recipe_run.approval_status != RECIPE_RUN_STATUSES.Approved) {
        TE(`Recipe run ${recipe_run_id} was not approved! was ${recipe_run.approval_status}.`);
    }

    //fetch all individual recipe run details
    const recipe_run_details = await RecipeRunDetail.findAll({
        where: {
            recipe_run_id: recipe_run_id
        }
    });
    //fetch all asset ids involved in this venture
    // (to more concisely fetch involved instruments)
    const asset_ids = _.uniq(_.flatMap(recipe_run_details, recipe_run_detail => {
        return [recipe_run_detail.transaction_asset_id, recipe_run_detail.quote_asset_id]
    }));

    //fetch all instruments corresponding to detail assets
    //map them by instrument id
    const instruments_by_id = _.keyBy(await Instrument.findAll({
        where: {
            transaction_asset_id: asset_ids,
            quote_asset_id: asset_ids
        }
    }), 'id');

    //find out what sort of exchanges are mapped to the fetched instruments
    //group by instruments that are allowed on those exchanges
    const grouped_exchanges = _.groupBy(await InstrumentExchangeMapping.findAll({
        where: {
            instrument_id: Object.keys(instruments_by_id)
        }
    }), 'instrument_id');

    //get latest ask/bid for those pairs (first element in group is latest)
    //grouped into {
    // [instrument_id, exchange_id]: [{market_data}, {market_data}...], 
    // [instrument_id, exchange_id]: [{market_data}, {market_data}...], 
    // ...
    //}
    //while having instrument objects in the keys would be more
    // convenient, JS doesnt support that
    const grouped_market_data = _.groupBy(await InstrumentMarketData.findAll({
        where: {
            instrument_id: Object.keys(grouped_exchanges),
            exchange_id: _.flatMap(_.map(Object.values(grouped_exchanges), 'exchange_id'))
        },
        order: [
            ['timestamp', 'DESC']
        ]
    }), market_data => {
        return [market_data.instrument_id, market_data.exchange_id]
    });

    //fetch balance info from exchanges
    const exchange_deposits = await fetch_exchange_deposits(_.map(recipe_run_details, 'target_exchange_id'));

    //filter out recipe run detailes where we dont have the info
    const market_data_keys = Object.keys(grouped_market_data);
    const valid_recipe_run_details = _.filter(recipe_run_details, recipe_run_detail => {
        //is there market data 
        //for assets of recipe on exchange of recipe
        const market_data = marketDataKeyForRunDetail(market_data_keys, instruments_by_id, recipe_run_detail);
        //is there a deposit in the currency we wish to sell
        const deposit = exchange_deposits[recipe_run_detail.target_exchange_id];
        //deposit is valid if there is money of the quote asset
        const deposit_valid = (deposit != null &&
            deposit[recipe_run_detail.quote_asset_id] != null &&
            deposit[recipe_run_detail.quote_asset_id] > 0.0);

        //if either is missing, this is a bad recipe detail and will be ignored
        if (market_data && deposit_valid) {
            return true;
        } else {
            console.log(`
            WARN: Skipping recipe run detail due to missing info/no deposit! 
            Recipe run detail id: ${recipe_run_detail.id}
            Detail exchange id: ${recipe_run_detail.target_exchange_id}
            Detail proposed trade: ${recipe_run_detail.transaction_asset_id}/${recipe_run_detail.quote_asset_id}
            Detail percentage: ${recipe_run_detail.investment_percentage}\n`);
            return false;
        }
    });
    if (valid_recipe_run_details.length == 0) TE(`no valid recipe run details! Check WARN messages...`);

    //run details filtered, generating orders group for orders
    let [err, orders_group] = await to(RecipeOrderGroup.create({
        created_timestamp: new Date(),
        approval_status: RECIPE_ORDER_GROUP_STATUSES.Pending,
        approval_timestamp: null,
        approval_comment: '',
        approval_user_id: recipe_run.approval_user_id,
        recipe_run_id: recipe_run_id
    }));
    if (err || !orders_group) TE(`error creating orders group: ${err}`, err);

    let results = [];
    //create saving futures for orders from recipe run details
    [err, results] = await to(Promise.all(_.map(valid_recipe_run_details, recipe_run_detail => {

        const market_data_key = marketDataKeyForRunDetail(market_data_keys, instruments_by_id, recipe_run_detail);
        //if the market data and recipe run detail use the same base currency
        //then we use the bid price and make a buy order
        const buy_order = recipe_run_detail.transaction_asset_id == market_data_key[0].transaction_asset_id;
        const market_data = grouped_market_data[market_data_key][0];
        //get correct price/order side
        const price = (buy_order ? market_data.bid_price : market_data.ask_price);
        const side = buy_order ? ORDER_SIDES.Buy : ORDER_SIDES.Sell;
        //get deposit in base currency
        const deposit = exchange_deposits[recipe_run_detail.target_exchange_id][recipe_run_detail.quote_asset_id];
        //total amount to spend on this currency
        const spend_amount = recipe_run_detail.investment_percentage * deposit;
        //amount of currency to buy
        const qnty = spend_amount / price;

        return RecipeOrder.create({
            recipe_order_group_id: orders_group.id,
            instrument_id: market_data.instrument_id,
            target_exchange_id: recipe_run_detail.target_exchange_id,
            price: price,
            quantity: qnty,
            side: side,
            status: RECIPE_ORDER_STATUSES.Pending
        });
    })));

    if (err) TE(`Error saving new recipe orders based on recipe run details: ${err}`, err);

    return results;
}
module.exports.generateApproveRecipeOrders = generateApproveRecipeOrders;


const changeRecipeOrderGroupStatus = async (user_id, order_group_id, status, comment = null) => {

    if (user_id == null || order_group_id == null) {
        TE(`Can't alter recipe order group with null user_id or null order_group_id!`);
    }
    if (!Object.values(RECIPE_ORDER_GROUP_STATUSES).includes(status)) {
        TE(`Supplied status ${status} is not within allowed statuses of recipe order!`);
    }
    if ((status == RECIPE_ORDER_GROUP_STATUSES.Approved || status == RECIPE_ORDER_GROUP_STATUSES.Rejected) &&
        comment == null) {
        TE(`Must provide comment when approving or rejecting recipe orders group!`);
    }

    const recipe_order_group = await RecipeOrderGroup.findById(order_group_id);
    if (recipe_order_group == null) {
        TE(`Recipe order group for id ${recipe_order_group_id} was not found!`);
    }

    //status already same, low warning and exist as NOOP
    if (recipe_order_group.approval_status == status) {
        console.warn(`Recipe Order Group ${order_group_id} already has status ${status}! exiting...`);
        return recipe_order_group;
    }

    let update_group_promise = Promise.resolve(recipe_order_group).then(recipe_order_group => {

        //change recipe order group properties due to approval
        Object.assign(recipe_order_group, {
            approval_status: status,
            approval_user_id: user_id,
            approval_timestamp: new Date(),
            approval_comment: (comment != null) ? comment : recipe_order_group.approval_comment
        });

        return recipe_order_group.save();
    });

    //if the group is being rejected, have to reject all the orders as well
    if (status == RECIPE_ORDER_GROUP_STATUSES.Rejected) {

        update_group_promise = update_group_promise.then(recipe_order_group => {
            return Promise.all([
                Promise.resolve(recipe_order_group),
                recipe_order_group.getRecipeOrders()
            ]);
        }).then(orders_data => {
            let [recipe_order_group, recipe_orders] = orders_data;
            //broadcast approval to all recipe orders in group
            return Promise.all([
                Promise.resolve(recipe_order_group),
                Promise.all(recipe_orders.map(recipe_order => {
                    recipe_order.status = RECIPE_ORDER_STATUSES.Rejected;
                    return recipe_order.save();
                }))
            ]);
        });
    }

    let [err, results] = await to(update_group_promise);

    if (err) {
        TE(err);
    }

    return results;
};
module.exports.changeRecipeOrderGroupStatus = changeRecipeOrderGroupStatus;