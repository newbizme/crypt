'use strict';

const Asset = require('../models').Asset;
const AssetStatusChange = require('../models').AssetStatusChange;
const AssetMarketCapitalization = require('../models').AssetMarketCapitalization;
const User = require('../models').User;
const sequelize = require('../models').sequelize;

const changeStatus = async function (asset_id, new_status, user_id) {
  
  if (!_.valuesIn(INSTRUMENT_STATUS_CHANGES).includes(new_status.type))
    TE("Provided bad asset status");

  let [err, asset] = await to(Asset.findById(asset_id));
  if (!asset) TE("Asset not found");
  let user = await User.findById(user_id);

  let status = new AssetStatusChange({
    timestamp: new Date(),
    comment: new_status.comment,
    type: new_status.type
  });

  status.setAsset(asset);
  if (user) status.setUser(user);

  [err, status] = await to(status.save());
  if (err) TE(err.message);

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
    `,
    {
      replacements: {
        type: INSTRUMENT_STATUS_CHANGES.Whitelisting
      },
      model: Asset,
      type: sequelize.QueryTypes.SELECT
    }
  ));

  if (err) TE(err.message);

  return assets;
};
module.exports.getWhitelisted = getWhitelisted;


const getIndex = async function (type) {
  // get assets that aren't blacklisted, sorted by marketcap average of 7 days
  let [err, assets] = await to(sequelize.query(`
    SELECT asset.id, asset.symbol, asset.long_name, asset.is_base, asset.is_deposit, 
    avg(cap.market_share_percentage) as avg_share
        FROM asset
        INNER JOIN 
      (
        SELECT * FROM asset_market_capitalization as c
        WHERE c.timestamp >= NOW() - interval '7 days'
      ) as cap ON cap.asset_id=asset.id
      WHERE
      (
        (SELECT 
          CASE type WHEN 400 THEN true ELSE false END
          FROM asset_status_change
          WHERE asset_id=asset.id
          ORDER BY timestamp DESC
          LIMIT 1)
        OR
        NOT EXISTS (SELECT true FROM asset_status_change WHERE asset_id = asset.id)
      )
    AND is_base=false
    GROUP BY asset.id, asset.symbol, asset.long_name, asset.is_base, asset.is_deposit
    ORDER BY avg_share DESC
    LIMIT 70
    `,
    {
      replacements: {
        type: INSTRUMENT_STATUS_CHANGES.Whitelisting
      },
      /* model: Asset, */
      type: sequelize.QueryTypes.SELECT
    }
  ));
  
  let totalMarketShare = 0;
  let lci = _.remove(assets.slice(0, INDEX_LCI_CAP), function (coin) {
    totalMarketShare += parseFloat(coin.avg_share);
    return totalMarketShare <= LCI_MARKETSHARE_PRC;
  });

  if (type == 'lci')
    return lci;

  let mci = assets.slice(lci.length, lci.length+INDEX_MCI_CAP);

  return mci;
};
module.exports.getIndex = getIndex;