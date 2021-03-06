'use strict';

const Asset = require('../models').Asset;
const AssetStatusChange = require('../models').AssetStatusChange;
const AssetMarketCapitalization = require('../models').AssetMarketCapitalization;
const Exchange = require('../models').Exchange;
const InstrumentExchangeMapping = require('../models').InstrumentExchangeMapping;
const User = require('../models').User;
const sequelize = require('../models').sequelize;
const Op = require('../models').Sequelize.Op;

const { logAction } = require('../utils/ActionLogUtil');

const changeStatus = async function (asset_id, new_status, user) {

  if (!_.valuesIn(INSTRUMENT_STATUS_CHANGES).includes(new_status.type))
    TE("Provided bad asset status");

  if(!_.isString(new_status.comment)) TE(`Must provide a vlid comment/reason`);
  
  let [err, asset] = await to(Asset.findById(asset_id));
  if(err) TE(err.message);
  if (!asset) TE("Asset not found");

  let current_status = null;
  [ err, current_status ] = await to(AssetStatusChange.findOne({
    where: { asset_id },
    order: [[ 'timestamp', 'DESC' ]]
  }));

  //Don't allow same status as the current one.
  if(!current_status) current_status = { type: INSTRUMENT_STATUS_CHANGES.Whitelisting }
  if(current_status.type === new_status.type) TE(`Cannot set the same status as the current status of the asset ${asset.symbol}`);
  

  let status = null;

  [err, status] = await to(AssetStatusChange.create({
    timestamp: new Date(),
    comment: new_status.comment,
    type: new_status.type,
    asset_id: asset.id,
    user_id: user ? user.id : null
  }));

  if (err) TE(err.message);

  //Log only after the changes were made. If user was not provided, log as System.
  const log_options = {
    args: {
      prev_status: `{assets.status.${current_status.type}}`,
      new_status: `{assets.status.${status.type}}`,
      reason: status.comment,
    },
    relations: { asset_id }
  }
  if(user) {
    user.logAction('assets.status', log_options);
  }
  else {
    logAction('assets.status', log_options);
  }

  return status;
};
module.exports.changeStatus = changeStatus;

const getWhitelisted = async function () {
  // This query finds assets that are whitelisted(last status type is equal to whitelisted) or don't have any status yet.
  let [err, assets] = await to(sequelize.query(`
    SELECT *
    FROM asset
    WHERE
      (SELECT 
        CASE type WHEN :type THEN true ELSE false END
        FROM asset_status_change
        WHERE asset_id=asset.id
        ORDER BY timestamp DESC
        LIMIT 1)
      OR
      NOT EXISTS (SELECT true FROM asset_status_change WHERE asset_id = asset.id)
    `, {
    replacements: {
      type: INSTRUMENT_STATUS_CHANGES.Whitelisting
    },
    model: Asset,
    type: sequelize.QueryTypes.SELECT
  }));

  if (err) TE(err.message);

  return assets;
};
module.exports.getWhitelisted = getWhitelisted;

/**
 * Returns a list of assets (currency data objects) that currently represent the provided strategy type for investment runs
 * Only checks whitelisted coins. Can exclude assets by list of ids.
 * @param strategy_type a value from the STRATEGY_TYPES enumeration described in model_constants.js 
 */
const getStrategyAssets = async function (strategy_type, exclude_from_index = []) {  
  //check for valid strategy type
  if (!Object.values(STRATEGY_TYPES).includes(parseInt(strategy_type, 10))) {
    TE(`Unknown strategy type ${strategy_type}!`);
  }
  
  let exclude_string = exclude_from_index.length ? 
    `AND asset.id NOT IN (${exclude_from_index.join()})` :
    ``;

  // get assets that aren't blacklisted, sorted by marketcap average of 7 days
  let [err, assets] = await to(sequelize.query(`
    SELECT asset.id,
          asset.symbol,
          asset.long_name,
          asset.is_base,
          asset.is_deposit,
          avg(cap.market_share_percentage) AS avg_share

    FROM asset
    INNER JOIN
      ( SELECT *
      FROM asset_market_capitalization AS c
      WHERE c.timestamp >= NOW() - interval '7 days' ) AS cap ON cap.asset_id=asset.id
    WHERE (
            (SELECT CASE TYPE WHEN ${INSTRUMENT_STATUS_CHANGES.Whitelisting} THEN TRUE ELSE FALSE END
              FROM asset_status_change
              WHERE asset_id=asset.id
              ORDER BY TIMESTAMP DESC LIMIT 1)
          OR NOT EXISTS
            (SELECT TRUE
              FROM asset_status_change
              WHERE asset_id = asset.id) )
        ${exclude_string}

    GROUP BY asset.id,
            asset.symbol,
            asset.long_name,
            asset.is_base,
            asset.is_deposit
    ORDER BY avg_share DESC LIMIT ${SYSTEM_SETTINGS.INDEX_LCI_CAP + SYSTEM_SETTINGS.INDEX_MCI_CAP}`, {
    type: sequelize.QueryTypes.SELECT
  }));

  if (err) TE(err.message);

  assets.map(a => {
    Object.assign(a, {
      avg_share: parseFloat(a.avg_share),
    });
  });

  let totalMarketShare = 0;
  // selects all assets before threshold MARKETCAP_LIMIT_PERCENT, total marketshare sum of assets
  let before_marketshare_limit = assets.reduce((acc, coin, currentIndex) => {
    totalMarketShare += coin.avg_share;
    if(totalMarketShare <= SYSTEM_SETTINGS.MARKETCAP_LIMIT_PERCENT)
      acc.push(coin);
    return acc;
  }, []);

  let lci = before_marketshare_limit.slice(0, SYSTEM_SETTINGS.INDEX_LCI_CAP);

  if (strategy_type == STRATEGY_TYPES.LCI) {
    return lci;
  }

  let mci = assets.slice(lci.length, lci.length + SYSTEM_SETTINGS.INDEX_MCI_CAP);

  return mci;
};
module.exports.getStrategyAssets = getStrategyAssets;


/** Finds all possible ways to acquire asset. Returns all instruments and exchanges,
 * with volume and lastest ask&bid prices.
 * @param asset_id id of asset to find instruments for
 */
const getAssetInstruments = async function (asset_id) {
  let err, instruments;
  [err, instruments] = await to(sequelize.query(`
  SELECT i.id as instrument_id,
    i.transaction_asset_id,
    i.quote_asset_id,
    imp.exchange_id,
    imd.ask_price,
    imd.bid_price
  FROM instrument as i
  JOIN instrument_exchange_mapping AS imp ON imp.instrument_id=i.id

  JOIN instrument_market_data as imd ON imd.id=(
    SELECT id
    FROM instrument_market_data as imdd
    WHERE imdd.instrument_id=i.id
    AND imdd.exchange_id=imp.exchange_id
    ORDER BY timestamp DESC LIMIT 1
  )
  WHERE i.transaction_asset_id=${asset_id} OR i.quote_asset_id=${asset_id}
    `, {
      type: sequelize.QueryTypes.SELECT
    })
  );

  if (err) TE(err.message);

  instruments.map(i => {
    Object.assign(i, {
      
      ask_price: parseFloat(i.ask_price),
      bid_price: parseFloat(i.bid_price)
    });
  });

  return instruments;
};
module.exports.getAssetInstruments = getAssetInstruments;

const getInstrumentLiquidityRequirements = async function (instrument_id, exchange_id) {
   let [err, requirements] = await to(sequelize.query(
    `SELECT AVG(ilh.volume) as avg_vol,
    iem.instrument_id,
    iem.exchange_id,
    ilr.minimum_volume,
    ilr.periodicity_in_days
  FROM instrument AS i
  JOIN instrument_exchange_mapping AS iem ON iem.instrument_id=i.id
  JOIN instrument_liquidity_requirement AS ilr ON ilr.instrument_id=iem.instrument_id AND
    (ilr.exchange=iem.exchange_id OR ilr.exchange IS NULL)
  LEFT JOIN instrument_liquidity_history AS ilh ON (
    ilh.instrument_id=iem.instrument_id
    AND 
    ilh.exchange_id=iem.exchange_id
    AND
    timestamp_to > NOW() - ilr.periodicity_in_days * interval '1 days'
  )
  WHERE iem.instrument_id=:instrument_id AND iem.exchange_id=:exchange_id
  GROUP BY iem.instrument_id, iem.exchange_id, ilr.minimum_volume, ilr.periodicity_in_days`,
  {
    replacements: {
      instrument_id,
      exchange_id
    },
    type: sequelize.QueryTypes.SELECT
  }));
  
  if (err) TE(err.message);

  requirements.map(r => {
    Object.assign(r, {
      minimum_volume: parseFloat(r.minimum_volume),
      avg_vol: parseFloat(r.avg_vol)
    });
  });

  return requirements;
};
module.exports.getInstrumentLiquidityRequirements = getInstrumentLiquidityRequirements;

const getBaseAssetPrices = async function () {
  const ttl_threshold = SYSTEM_SETTINGS.BASE_ASSET_PRICE_TTL_THRESHOLD;

  let [err, prices] = await to(sequelize.query(`
  SELECT prices.symbol as symbol, AVG(prices.price) as price
  FROM
  (
    SELECT assetBuy.symbol as symbol, imd1.ask_price as price, imd1.timestamp as timestamp
    FROM asset as a1
    JOIN instrument i ON i.quote_asset_id=a1.id
    JOIN asset as assetBuy ON assetBuy.id=i.transaction_asset_id
    JOIN instrument_exchange_mapping as iem1 ON iem1.instrument_id=i.id
    JOIN instrument_market_data imd1 ON imd1.id=(
        SELECT id FROM instrument_market_data imdd 
        WHERE imdd.instrument_id=i.id
          AND imdd.exchange_id=iem1.exchange_id
        ORDER BY timestamp DESC
        LIMIT 1
      )
    WHERE a1.symbol='USD'
      AND assetBuy.is_base=true
    GROUP BY assetBuy.symbol, imd1.ask_price, imd1.timestamp
    
    UNION 
    
    SELECT assetSell.symbol as symbol, (1 / imd2.bid_price) as price, imd2.timestamp as timestamp
    FROM asset as a2
    JOIN instrument i ON i.transaction_asset_id=a2.id
    JOIN asset as assetSell ON assetSell.id=i.quote_asset_id
    JOIN instrument_exchange_mapping as iem2 ON iem2.instrument_id=i.id
    JOIN instrument_market_data imd2 ON imd2.id=(
        SELECT id FROM instrument_market_data imdd 
        WHERE imdd.instrument_id=i.id
          AND imdd.exchange_id=iem2.exchange_id
        ORDER BY timestamp DESC
        LIMIT 1
      )
    WHERE a2.symbol='USD'
    AND assetSell.is_base=true
    GROUP BY assetSell.symbol, imd2.bid_price, imd2.timestamp
  ) as prices
  WHERE prices.timestamp >= NOW() - interval '${ttl_threshold} seconds'
  GROUP BY prices.symbol
  `, {
    type: sequelize.QueryTypes.SELECT
  }));

  if (err) TE(err.message);

  if (!prices.length){
    const message_start = `No base asset prices in USD for past ${Math.floor(ttl_threshold/60)} minutes found!`;

    const existing_mappings = await InstrumentExchangeMapping.findAll({
      where: {
        external_instrument_id: {
          [Op.iLike]: '%/USDT'
        }
      }
    });
    const missing_exchanges = await Exchange.findAll({
      where: {
        id: {
          [Op.notIn]: _.map(existing_mappings, 'exchange_id')
        }
      }
    });
    if (!_.isEmpty(missing_exchanges)) {
      const missing_exchanges_message = `
      Missing USDT instrument mappings for exchanges: ${_.join(_.map(missing_exchanges, 'name'), ', ')}. 
      Please use/create an instrument with either 'Us Dollars' or 'Tether' as the Quote Asset and add the missing mappings`;

      TE(message_start + '\n' + missing_exchanges_message);
    } else {
      //we really are missing recent ask/bids
      const missing_prices = `Missing recent prices. Please wait for new prices to be fetched 
      OR manually launch the job EXCH_ASK_BID, 
      OR increase its automatic frequency, 
      OR increase the BASE_ASSET_PRICE_TTL_THRESHOLD system threshold to allow for older price points.`;

      TE(message_start + '\n' + missing_prices);
    }

  } 

  prices.map(p => {
    Object.assign(p, {
      price: parseFloat(p.price),
    });
  });

  return prices;
}
module.exports.getBaseAssetPrices = getBaseAssetPrices;

const fetchAssetStatusHistory = async (asset) => {

  const sorted_history = await AssetStatusChange.findAll({
    where: {
      asset_id: asset.id
    },
    include: [
      {
        model: User
      }
    ],
    order: [
      ['timestamp', 'DESC']
    ]
  })

  return sorted_history;
}
module.exports.fetchAssetStatusHistory = fetchAssetStatusHistory;

