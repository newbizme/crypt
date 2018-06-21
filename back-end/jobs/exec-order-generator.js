"use strict";

/**
 * Return the symbol for whichever currency is being sold in the context of this order, out of the order currency pair. 
 * Basically checks the instrument and the order side, returning the correct part of the pair based
 * on buy/sell info. Kept synchornous by assumption of realized `instrument` field.
 * @param order the order for which to return symbol being sold. Must have `instrument` field realized
 */
const get_order_sold_symbol = (order) => {

    const order_instrument = order.instrument;
    const [tx_symbol, quote_symbol] = order_instrument.symbol.split('/');

    switch (order.side) {

        case ORDER_SIDES.Buy:
            return quote_symbol;
        case ORDER_SIDES.Sell:
            return tx_symbol;
        default:
            TE(`Unkown order side ${order.side} on order ${order}`);
    }
};

//every day, every 5 minutes
module.exports.SCHEDULE = "0 5 * * * *";
module.exports.NAME = "GEN_EXEC_OR";
module.exports.JOB_BODY = async (config, log) => {
    //reference shortcuts
    const models = config.models;
    const RecipeOrder = models.RecipeOrder;
    const ExecutionOrder = models.ExecutionOrder;
    const Instrument = models.Instrument;

    //settings should be injected before this point in db-config, so its safe to reference
    const trade_base = {
        BTC: SYSTEM_SETTINGS.BASE_BTC_TRADE,
        ETH: SYSTEM_SETTINGS.BASE_ETH_TRADE
    };
    const fuzzyness = SYSTEM_SETTINGS.TRADE_BASE_FUZYNESS;

    return RecipeOrder.findAll({
        where: {
            status: RECIPE_ORDER_STATUSES.Pending
        },
        include: [Instrument]
    }).then(pending_orders => {
        log(`Analyzing ${pending_orders.length} pending orders...`)
        return Promise.all(
            _.map(pending_orders, pending_order => {

                const sold_symbol = get_order_sold_symbol(pending_order);
                const base_trade_amount = trade_base[sold_symbol];
                if (base_trade_amount == null) {
                    log(`ERROR: no base trade recorded for currency symbol ${sold_symbol}! Setting order status to ${RECIPE_ORDER_STATUSES.Failed}...`)
                    pending_order.status = RECIPE_ORDER_STATUSES.Failed;
                    return pending_order.save();
                }
                const fuzzy_trade_amount = base_trade_amount * (1 + (_.random(-fuzzyness, fuzzyness, true)));
                log(`using fuzzy ${sold_symbol} amount ${fuzzy_trade_amount} for execution of order ${pending_order.id}`)

                return Promise.all([
                    Promise.resolve(fuzzy_trade_amount),
                    Promise.resolve(pending_order),
                    ExecutionOrder.findAll({
                        where: {
                            recipe_order_id: pending_order.id
                        }
                    })
                ]).then(fuzzyAndOrderAndExec => {

                    //if fulfilled orders cover the entire sum in the recipe order we set this to completed 
                    const [fuzzy_trade_amount, pending_order, execution_orders] = fuzzyAndOrderAndExec;

                    //inspect existing execution orders of this pending one
                    const unfilled_execution = _.find(execution_orders, order =>
                        (order.status != EXECUTION_ORDER_STATUSES.FullyFilled &&
                            order.status != EXECUTION_ORDER_STATUSES.Cancelled)
                    )

                    if (unfilled_execution != null) {
                        //if execution order failed, lets fail the order as well
                        const new_order_status = unfilled_execution.status != EXECUTION_ORDER_STATUSES.Failed ? RECIPE_ORDER_STATUSES.Executing : RECIPE_ORDER_STATUSES.Failed;
                        log(`Found execution order ${unfilled_execution.id} with status ${unfilled_execution.status} for pending order ${pending_order.id}! Changing status to ${new_order_status} and moving on...`);
                        //if there are still unfufilled execution orders 
                        //then we change status of order to in progress and exit
                        pending_order.status = new_order_status;
                        return pending_order.save();
                    }

                    //if there are none or all existing ones are fulfilled/cancelled - generate new execution order,
                    //with traded value close to fuzyness but capped to remainder of order amount
                    const fulfilled_executions = _.filter(execution_orders, order => order.status == EXECUTION_ORDER_STATUSES.FullyFilled);
                    const realized_total = _.sumBy(fulfilled_executions, 'total_quantity');
                    if (realized_total >= pending_order.quantity) {
                        //if the order has been fulfilled, lets mark it as such
                        pending_order.status = RECIPE_ORDER_STATUSES.Completed;
                        return pending_order.save();
                    }
                    //next total is either the fuzze amount or remainder of unfufilled order quantity, whichever is smaller
                    const next_total = clamp(fuzzy_trade_amount, Number.MIN_VALUE, pending_order.quantity - realized_total);
                    const next_total_price = pending_order.price * (next_total / pending_order.quantity);
                    log(`Current fulfilled recipe order total is ${realized_total}, adding another ${next_total}...`);

                    //create next pending execution order and save it
                    return ExecutionOrder.create({
                        side: pending_order.side,
                        type: EXECUTION_ORDER_TYPES.Market,
                        total_quantity: next_total,
                        status: EXECUTION_ORDER_STATUSES.Pending,
                        recipe_order_id: pending_order.id,
                        instrument_id: pending_order.instrument_id,
                        exchange_id: pending_order.target_exchange_id,
                        price: next_total_price
                    });
                });
            })
        );
    });
};