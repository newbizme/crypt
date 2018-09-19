'use strict';

const InvestmentService = require('../services/InvestmentService');
const RecipeRunDeposit = require('../models').RecipeRunDeposit;
const RecipeRunDetail = require('../models').RecipeRunDetail;
const RecipeRunDetailInvestment = require('../models').RecipeRunDetailInvestment
const Asset = require('../models').Asset;
const Exchange = require('../models').Exchange;
const ExchangeAccount = require('../models').ExchangeAccount;
const InvestmentAssetConversion = require('../models').InvestmentAssetConversion;
const Sequelize = require('../models').Sequelize;

const { in: opIn, ne: opNe, or: opOr } = Sequelize.Op;

const { logAction } = require('../utils/ActionLogUtil'); 

const generateRecipeRunDeposits = async function (approved_recipe_run) {

  if (!approved_recipe_run
    || approved_recipe_run.approval_status == null
    || approved_recipe_run.approval_status !== RECIPE_RUN_STATUSES.Approved) {

    TE(`Bad input! submitted input must be a recipe run object with status ${RECIPE_RUN_STATUSES.Approved} (Approved)! GOt: ${approved_recipe_run}`)
  }

  //Get unique combinations of quote assets and exchanges.
  let [ err, details ] = await to(RecipeRunDetail.findAll({
    where: { recipe_run_id: approved_recipe_run.id },
    attributes: ['quote_asset_id', 'target_exchange_id', Sequelize.fn('sum', Sequelize.col('investment_percentage'))],
    group: ['quote_asset_id', 'target_exchange_id']
  }));
  
  if(err) TE(err.message);

  const exchange_ids = details.map(d => d.target_exchange_id);
  let exchange_accounts = [];
  [ err, exchange_accounts ] = await to(ExchangeAccount.findAll({
    where: { 
      exchange_id: { [opIn]: exchange_ids }
    }
  }));

  if(err) TE(err.message);

  //Find exchange account for each detail and create return a deposit for each one.
  let missing_acounts = [];
  let deposits = details.map(detail => {
    const account = exchange_accounts.find(ex_account => detail.target_exchange_id === ex_account.exchange_id && detail.quote_asset_id === ex_account.asset_id);
    if(account) return {
      asset_id: account.asset_id,
      creation_timestamp: new Date(),
      recipe_run_id: approved_recipe_run.id,
      target_exchange_account_id: account.id,
      status: MODEL_CONST.RECIPE_RUN_DEPOSIT_STATUSES.Pending
    };
    else missing_acounts.push({
      exchange_id: detail.target_exchange_id,
      quote_asset_id: detail.quote_asset_id
    });
    
  }).filter(deposit => deposit);

  //If there are missing accounts, reject. Also attempt to fetch exchanges and assets to be more informative.
  if(missing_acounts.length) {
    let [ err, result ] = await to(Promise.all([
      Exchange.findAll({ where: { id: { [opIn]: missing_acounts.map(m => m.exchange_id) } } }),
      Asset.findAll({ where: { id: { [opIn]: missing_acounts.map(m => m.quote_asset_id) } } })
    ]));

    if(err) TE(err.message);

    const [ missing_exchanges, missing_assets ] = result;

    const missing_pairs = missing_acounts.map(ma => {
      const exchange = missing_exchanges.find(me => me.id == ma.exchange_id);
      const asset = missing_assets.find(am => am.id === ma.quote_asset_id);
      return `${exchange.name}/${asset.symbol}`; 
    });

    TE(`Could not generate deposits, because deposit accounts are missing for Exchange/Asset pairs: ${missing_pairs.join(', ')}`);
  }

  //console.log(deposits)
  [ err, deposits ] = await to(RecipeRunDeposit.bulkCreate(deposits));
  
  if(err) TE(err.message);

  logAction('deposits.generate', { 
    args: {
      amount: deposits.length,
      recipe_id: approved_recipe_run.id
    },
    relations: { recipe_run_id: approved_recipe_run.id }
  });

  return deposits;

}
module.exports.generateRecipeRunDeposits = generateRecipeRunDeposits;

const submitDeposit = async (deposit_id, user_id, updated_values = {}) => {
  const { deposit_management_fee, amount } = updated_values;

  if(_.isEmpty(updated_values)){
    TE('Must provied at least the amount or deposit management fee.');
  }

  if((deposit_management_fee != null) && (!_.isNumber(deposit_management_fee) || deposit_management_fee < 0)) {
    TE('Deposit managmenent fee must be a positive number');
  }

  if((amount != null) && (!_.isNumber(amount) || amount < 0)) {
    TE('Deposit amount must be a positive number');
  }

  let [ err, deposit ] = await to(RecipeRunDeposit.findById(deposit_id));
  if(err) TE(err.message);
  if(!deposit) return null;
  if (deposit.status !== MODEL_CONST.RECIPE_RUN_DEPOSIT_STATUSES.Pending) TE(`Deposit submitting is only allowed for Pending deposits.`);

  const original_values = deposit.toJSON();

  deposit.fee = deposit_management_fee == null? deposit.fee : deposit_management_fee;
  deposit.amount = amount == null? deposit.amount : amount;

  [ err, deposit ] = await to(deposit.save());
  if(err) TE(err.message);

  return { original_deposit: original_values, updated_deposit: deposit };
};
module.exports.submitDeposit = submitDeposit;

const approveDeposit = async (deposit_id, user_id) => {

  let [err, deposit] = await to(RecipeRunDeposit.findById(deposit_id));

  if (err) TE(err.message);
  if (!deposit) return null;
  if (deposit.status !== MODEL_CONST.RECIPE_RUN_DEPOSIT_STATUSES.Pending) TE(`Deposit confirmation is only allowed for Pending deposits.`);
  const decimal0 = Decimal(0);
  //check amount
  const amount_decimal = Decimal(deposit.amount || '0')
  if (amount_decimal.lte(decimal0)) TE(`Can't confirm deposit ${deposit_id} with bad amount ${deposit.amount}`);
  const fee_decimal = Decimal(deposit.fee || '-1')
  if (fee_decimal.lt(decimal0)) TE(`Can't confirm deposit ${deposit_id} with bad fee ${deposit.fee}`);

  const original_values = deposit.toJSON();

  deposit.status = MODEL_CONST.RECIPE_RUN_DEPOSIT_STATUSES.Completed;
  deposit.depositor_user_id = user_id;
  deposit.completion_timestamp = new Date();

  [ err, deposit ] = await to(deposit.save());
  if(err) TE(err.message);

  logAction('deposits.completed', { relations: { recipe_run_deposit_id: deposit.id } });

  let left_deposits;
  [err, left_deposits] = await to(RecipeRunDeposit.findAll({
    where: {
      recipe_run_id: deposit.recipe_run_id,
      status: {
        [opNe]: RECIPE_RUN_DEPOSIT_STATUSES.Completed
      }
    }
  }));
  if (err) TE(err.message);

  if (!left_deposits.length) { // all deposits completed. Change investment run status to deposits completed
    let investment_run;
    [err, investment_run] = await to(InvestmentService.changeInvestmentRunStatus(
      { recipe_deposit_id: deposit_id }, INVESTMENT_RUN_STATUSES.DepositsCompleted
    ));
    if (err) TE(err.message);
  }

  return { original_deposit: original_values, updated_deposit: deposit };

};
module.exports.approveDeposit = approveDeposit;

const generateAssetConversions = async recipe_run => {

  const [ err, result ] = await to(Promise.all([
    RecipeRunDetail.findAll({
      where: { recipe_run_id: recipe_run.id },
      include: RecipeRunDetailInvestment
    }),
    Asset.findAll({
      where: {
        [opOr]: [
          { is_deposit: true }, { is_base: true }
        ]
      }
    })
  ]));

  const [ details, assets ] = result; 

  if(err) TE(err.message);
  if(!details.length) TE(`Could not locate recipe run details for recipe run with id "${recipe_run.id}"`);

  const investment_assets = assets.filter(asset => asset.is_deposit && !asset.is_base);
  const base_assets = assets.filter(asset => asset.is_base);

  const conversaions = [];
  for(let investment_asset of investment_assets) {
    for(let base_asset of base_assets) {

      const total_amount = details.filter(detail => detail.quote_asset_id === base_asset.id).reduce((total, detail) => {

        const investment = detail.RecipeRunDetailInvestments.find(inv => inv.asset_id === investment_asset.id);
        if(investment) total = total.plus(investment.amount);

        return total;

      }, Decimal(0));

      if(total_amount.gt(0)) conversaions.push({
        recipe_run_id: recipe_run.id,
        investment_asset_id: investment_asset.id,
        target_asset_id: base_asset.id
      });

    }
  }

  return conversaions;

};
module.exports.generateAssetConversions = generateAssetConversions;

const completeAssetConversion = async (conversion_id, amount, user) => {

  if(!_.isNumber(amount) || amount <= 0) TE(`Converted amount must a positive number`);
  
  const [ err, conversion ] = await to(InvestmentAssetConversion.findById(conversion_id));

  if(err) TE(err.message);
  if(!conversion) return null;

  if(conversion.status === ASSET_CONVERSION_STATUSES.Completed) {
    TE(`Conversion with id "${conversion_id}" is already Completed`);
  }

  conversion.amount = amount;
  conversion.completed_timestamp = new Date();
  conversion.depositor_user_id = user.id;
  conversion.status = ASSET_CONVERSION_STATUSES.Completed;

  return conversion.save();

};
module.exports.completeAssetConversion = completeAssetConversion;