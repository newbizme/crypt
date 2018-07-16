'use strict';

const adminViewService = require('../services/AdminViewsService');

const createInstrument = async function (req, res) {
 
  // mock data below
  let {
    transaction_asset_id,
    quote_asset_id
  } = req.body;

  if (!transaction_asset_id || !quote_asset_id)
    return ReE(res, "Both assets must be specified to create an instrument", 422);

  let instrument_mock = {
    id: 1,
    transaction_asset_id: 28,
    quote_asset_id: 2,
    symbol: "BTC/XRP"
  };

  return ReS(res, {
    instrument: instrument_mock
  });
};
module.exports.createInstrument = createInstrument;

const getInstrument = async function (req, res) {

  // mock data below
  let instrument_id = req.params.instrument_id;

  let instrument_mock = {
    id: instrument_id,
    transaction_asset_id: 28,
    quote_asset_id: 2,
    symbol: "BTC/XRP",
    exchanges_connected: 4,
    exchanges_failed: 3
  };

  return ReS(res, {
    instrument: instrument_mock
  });
};
module.exports.getInstrument = getInstrument;

const getInstruments = async function (req, res) {

  let instruments_mock = [...Array(20)].map((i, index) => ({
      id: index + 1,
      transaction_asset_id: 28,
      quote_asset_id: 2,
      symbol: "BTC/XRP",
      exchanges_connected: 4,
      exchanges_failed: 3
  }));

  let footer = await adminViewService.fetchInstrumentsViewFooter();

  return ReS(res, {
    instruments: instruments_mock,
    footer,
    count: instruments_mock.length
  });
};
module.exports.getInstruments = getInstruments;

/** Controller for checking if instrument can be mapped with exchange. If yes, information
 * from exchange is returned.
*/
const checkInstrumentExchangeMap = async function (req, res) {
  
  let instrument_id = req.params.instrument_id;

  let {
    exchange_id,
    external_instrument_id
  } = req.body;

  if (!instrument_id || !exchange_id || !external_instrument_id)
    return ReE(res, "Instrument ID, exchange and external instrument ID must be specified to map", 422);

  let mapping_data = {
    instrument_id,
    exchange_id,
    external_instrument_id,
    current_price: 7422.46,
    last_day_vol: 12300,
    last_week_vol: 86100,
    last_updated: 1531486061727
  };

  return ReS(res, {
    mapping_data
  });
};
module.exports.checkInstrumentExchangeMap = checkInstrumentExchangeMap;

const mapInstrumentsWithExchanges = async function (req, res) {

  let instrument_id = req.params.instrument_id;
  let exchange_mapping = req.body.exchange_mapping;

  if (!exchange_mapping || !exchange_mapping.length || !instrument_id)
    return ReE(res, "Instrument ID and exchange mappings must be supplied to map exchanges with instrument", 422);

  // enforce specific exchange mapping structure
  if (!exchange_mapping.every((map) => {
    return typeof map === 'object' && map.exchange_id && map.external_instrument_id;
  }));

  return ReS(res, {
    message: "OK!"
  });
};
module.exports.mapInstrumentsWithExchanges = mapInstrumentsWithExchanges;

const getInstrumentExchanges = async function (req, res) {

  // mock data belows
  let instrument_id = req.params.instrument_id;

  let mapping_data = [...Array(8)].map((map, index) => ({
    instrument_id,
    exchange_id: index,
    exchange_name: "Bitstamp" + index,
    external_instrument: "BTC/XRP",
    current_price: 7422.46,
    last_day_vol: 12300,
    last_week_vol: 86100,
    last_updated: 1531486061727,
    liquidity_rules: 3
  }));

  return ReS(res, {
    mapping_data
  });
};
module.exports.getInstrumentExchanges = getInstrumentExchanges;


// liquidity requirements

const createLiquidityRequirement = async function (req, res) {
 
  // mock data below
  let {
    instrument_id,
    exchange_id,
    periodicity,
    minimum_circulation
  } = req.body;

  if (!instrument_id || 
    !exchange_id || 
    !periodicity || 
    !minimum_circulation)
    return ReE(res, "Please fill all values: instrument_id, exchange_id, periodicity, minimum_circulation", 422);

  let liquidity_mock = {
    id: 1,
    instrument_id: instrument_id,
    instrument: "BTC/ETH",
    periodicity: 7,
    quote_asset: "BTC",
    minimum_circulation: 60000,
    exchange: "All exchanges",
    exchange_count: 2,
    exchange_pass: 2
  };

  return ReS(res, {
    liquidity_requirement: liquidity_mock
  });
};
module.exports.createLiquidityRequirement = createLiquidityRequirement;

const getLiquidityRequirement = async function (req, res) {
 
  // mock data below
  let liquidity_req_id = req.params.liquidity_requirement_id

  if (!liquidity_req_id)
    return ReE(res, "Not found", 422);

  let liquidity_mock = {
    id: liquidity_req_id,
    instrument: "BTC/ETH",
    periodicity: 7,
    quote_asset: "BTC",
    minimum_circulation: 60000,
    exchange: "All exchanges",
    exchange_count: 2,
    exchange_pass: 2
  };

  return ReS(res, {
    liquidity_requirement: liquidity_mock
  });
};
module.exports.getLiquidityRequirement = getLiquidityRequirement;


const getLiquidityRequirements = async function (req, res) {
 
  // mock data below

  let liquidity_mock = [...Array(20)].map((map, index) => ({
    id: index,
    instrument: "BTC/ETH",
    periodicity: 7,
    quote_asset: "BTC",
    minimum_circulation: 60000,
    exchange: "All exchanges",
    exchange_count: 2,
    exchange_pass: 2
  }));

  let footer = await adminViewService.fetchLiquidityViewFooter();

  return ReS(res, {
    liquidity_requirements: liquidity_mock,
    count: liquidity_mock.length,
    footer  
  });
};
module.exports.getLiquidityRequirements = getLiquidityRequirements;


const getLiquidityRequirementExchanges = async function (req, res) {
 
  // mock data below
  let liquidity_requirement_id = req.params.liquidity_requirement_id

  if (!liquidity_requirement_id)
    return ReE(res, "Not found", 422);

  let liquidity_mock = [...Array(8)].map((map, index) => ({
    id: index,
    exchange_id: 1,
    exchange: "Bitstamp",
    instrument: "BTC/ETH",
    instrument_identifier: "XRP/BTC",
    last_day_vol: 12300,
    last_week_vol: 86100,
    last_updated: 1531725075560,
    passes: true 
  }));

  let footer = await adminViewService.fetchLiquidityExchangesViewFooter();

  return ReS(res, {
    exchanges: liquidity_mock,
    count: liquidity_mock.length,
    footer
  });
};
module.exports.getLiquidityRequirementExchanges = getLiquidityRequirementExchanges;