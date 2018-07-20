"use strict";

let app = require("../../app");
let chai = require("chai");
let asPromised = require('chai-as-promised');
let should = chai.should();
const sinon = require("sinon");

chai.use(asPromised);

describe('InvestmentService testing:', () => {

  //ensure working DB before test
  before(done => {

      app.dbPromise.then(migrations => {
          console.log("Migrations: %o", migrations);
          done();
      })
  });

  
  const investmentService = require('./../../services/InvestmentService');
  const assetService = require('./../../services/AssetService');
  const ordersService = require('./../../services/OrdersService');
  const InvestmentRun = require('./../../models').InvestmentRun;
  const RecipeRun = require('./../../models').RecipeRun;
  const RecipeRunDetail = require('./../../models').RecipeRunDetail;
  const Asset = require('./../../models').Asset;



  let USER_ID = 1;
  let INVESTMENT_RUN_ID = 1;
  let RECIPE_RUN_ID = 1;
  let STRATEGY_TYPE = STRATEGY_TYPES.LCI;
  let IS_SIMULATED = true;
  let RECIPE_STATUS = INVESTMENT_RUN_STATUSES.RecipeRun;
  let RECIPE_STATUS_CHANGE = RECIPE_RUN_STATUSES.Approved;
  let RECIPE_APPROVAL_COMMENT = 'Approving recipe';

  beforeEach(() => {
    sinon.stub(InvestmentRun, 'create').callsFake((data) => {
      return Promise.resolve(data);
    })
    sinon.stub(InvestmentRun, 'findOne').returns(Promise.resolve());
    sinon.stub(InvestmentRun, 'findById').callsFake(id => {
      let investment_run = new InvestmentRun({
        id: id,
        strategy_type: STRATEGY_TYPE,
        is_simulated: IS_SIMULATED,
        user_created_id: USER_ID,
        started_timestamp: new Date,
        updated_timestamp: new Date,
        status: INVESTMENT_RUN_STATUSES.Initiated
      });

      sinon.stub(investment_run, 'save').returns(
        Promise.resolve(investment_run)
      );

      return Promise.resolve(investment_run);
    });

    sinon.stub(RecipeRun, 'findOne').callsFake((query) => {
      return Promise.resolve();
    });

    sinon.stub(RecipeRun, 'findById').callsFake(id => {
      let recipe_run = new RecipeRun({
        id: id,
        created_timestamp: new Date(),
        investment_run_id: INVESTMENT_RUN_ID,
        user_created_id: USER_ID,
        approval_status: RECIPE_RUN_STATUSES.Pending,
        approval_comment: ''
      });

      sinon.stub(recipe_run, 'save').returns(Promise.resolve(recipe_run));

      return Promise.resolve(recipe_run);
    });

    sinon.stub(RecipeRun, 'create').callsFake(recipe_run => {
      recipe_run = new RecipeRun(recipe_run);
      sinon.stub(recipe_run, 'toJSON').returns(Promise.resolve(recipe_run));

      return Promise.resolve(recipe_run);
    });

    sinon.stub(RecipeRunDetail, 'create').callsFake(details => {
      return Promise.resolve(details);
    });

    sinon.stub(ordersService, 'generateApproveRecipeOrders').callsFake((id) => {
      return Promise.resolve();
    });
  });

  afterEach(() => {
    InvestmentRun.create.restore();
    InvestmentRun.findOne.restore();
    InvestmentRun.findById.restore();
    RecipeRun.findOne.restore();
    RecipeRun.create.restore();
    RecipeRun.findById.restore();
    RecipeRunDetail.create.restore();
    ordersService.generateApproveRecipeOrders.restore();
  });


  describe('and method createInvestmentRun shall', function () {

    it('shall exist', () => {
      chai.expect(investmentService.createInvestmentRun).to.exist;
    });

    it('shall reject bad strategy types', () => {
      return chai.assert.isRejected(investmentService.createInvestmentRun(
        USER_ID, -1, IS_SIMULATED
      ));
    });

    it('shall call required DB model methods', () => {
      return investmentService.createInvestmentRun(
        USER_ID, STRATEGY_TYPE, IS_SIMULATED
      ).then(investment_run => {
        chai.assert.isTrue(InvestmentRun.findOne.called);
        chai.assert.isTrue(InvestmentRun.create.called);
      });
    });

    it('shall reject already existing investment run of same type and mode', ()=> {
      if(InvestmentRun.findOne.restore)
        InvestmentRun.findOne.restore();

      sinon.stub(InvestmentRun, 'findOne').callsFake(query => {
        return Promise.resolve(query.where);
      });

      return chai.assert.isRejected(investmentService.createInvestmentRun(
        USER_ID, STRATEGY_TYPE, IS_SIMULATED
      ));
    })

    it('shall create new investment run if everything is good', () => {
      return investmentService.createInvestmentRun(
        USER_ID, STRATEGY_TYPE, IS_SIMULATED
      ).then(investment_run => {
        chai.expect(investment_run.strategy_type).to.be.eq(STRATEGY_TYPE);
        chai.expect(investment_run.is_simulated).to.be.eq(IS_SIMULATED);
        chai.expect(investment_run.user_created_id).to.be.eq(USER_ID);
        chai.expect(investment_run.status).to.be.eq(INVESTMENT_RUN_STATUSES.Initiated);
      });
    });
  });


  describe('and method changeInvestmentRunStatus shall', () => {
    
    it('shall exist', () => {
      return chai.expect(investmentService.changeInvestmentRunStatus).to.exist;
    });

    it('shall reject bad status numbers', () => {
      return chai.assert.isRejected(investmentService.changeInvestmentRunStatus(
        INVESTMENT_RUN_ID, -1
      ));
    });

    it('shall throw if investment run is not found', () => {
      if (InvestmentRun.findById.restore)
        InvestmentRun.findById.restore();

      sinon.stub(InvestmentRun, 'findById').callsFake(id => {
        return Promise.resolve();
      });

      return chai.assert.isRejected(investmentService.changeInvestmentRunStatus(
        INVESTMENT_RUN_ID, RECIPE_STATUS
      ))
    });

    it('shall update status and timestamp', () => {
      return investmentService.changeInvestmentRunStatus(
        INVESTMENT_RUN_ID, RECIPE_STATUS
      ).then(investment_run => {
        chai.expect(investment_run.status).to.be.eq(INVESTMENT_RUN_STATUSES.RecipeRun);
      });
    });
  });

  describe('and method changeRecipeRunStatus shall', () => {

    it('shall exist', () => {
      return chai.expect(investmentService.changeRecipeRunStatus).to.exist;
    });

    it('shall reject bad status number', () => {
      return chai.assert.isRejected(investmentService.changeRecipeRunStatus(
        USER_ID, RECIPE_RUN_ID, -1, RECIPE_APPROVAL_COMMENT
      ));
    });

    it('shall reject when comment is not provided', () => {
      return chai.assert.isRejected(investmentService.changeRecipeRunStatus(
        USER_ID, RECIPE_RUN_ID, RECIPE_STATUS
      ));
    });

    it('shall reject when when recipe run not found', () => {
      if(RecipeRun.findById.restore)
        RecipeRun.findById.restore();
      sinon.stub(RecipeRun, 'findById').returns(Promise.resolve());

      return chai.assert.isRejected(investmentService.changeRecipeRunStatus(
        USER_ID, RECIPE_RUN_ID, RECIPE_STATUS, RECIPE_APPROVAL_COMMENT
      ));
    });

    it('shall change required values', () => {
      return investmentService.changeRecipeRunStatus(
        USER_ID, RECIPE_RUN_ID, RECIPE_STATUS_CHANGE, RECIPE_APPROVAL_COMMENT
      ).then(recipe_run => {
        // check if values changed correctly
        chai.expect(recipe_run.approval_status).to.be.eq(RECIPE_STATUS_CHANGE);
        chai.expect(recipe_run.approval_user_id).to.be.eq(USER_ID);
        chai.expect(recipe_run.approval_comment).to.be.eq(RECIPE_APPROVAL_COMMENT);
        
        //check if generateApproveRecipeOrders was not called (this is not done seperately)
        chai.assert.isFalse(
          ordersService.generateApproveRecipeOrders.calledWith(RECIPE_RUN_ID)
        );
      });
    });
  });

  describe('and method createRecipeRun shall', () => {
    beforeEach(() => {
      sinon.stub(investmentService, 'changeInvestmentRunStatus').returns(
        Promise.resolve({
          strategy_type: STRATEGY_TYPE
        })
      );
      sinon.stub(investmentService, 'generateRecipeDetails').callsFake(() => {
        return Promise.resolve([
          {
            id: 1,
            symbol: "BTC",
            suggested_action: {
              id: 1,
              recipe_run_id: RECIPE_RUN_ID,
              transaction_asset_id: 1,
              quote_asset_id: 2,
              target_exchange_id: 3,
              investment_percentage: 100
            }
          }
        ]);
      });
    });

    afterEach(() => {
      investmentService.changeInvestmentRunStatus.restore();
      investmentService.generateRecipeDetails.restore();
    });

    it('shall exist', () => {
      return chai.expect(investmentService.createRecipeRun).to.exist;
    })

    it('shall throw if investment run already has a recipe pending approval', () => {
      if (RecipeRun.findOne.restore) 
        RecipeRun.findOne.restore();
      
      sinon.stub(RecipeRun, 'findOne').callsFake((query) => {
        return Promise.resolve({
          created_timestamp: new Date(),
          investment_run_id: query.where.investment_run_id,
          user_created_id: USER_ID,
          approval_status: RECIPE_RUN_STATUSES.Pending,
          approval_comment: ''
        });
      });

      return chai.assert.isRejected(investmentService.createRecipeRun(
        USER_ID, INVESTMENT_RUN_ID
      ));
    });

    it('shall call required methods', () => {
      return investmentService.createRecipeRun(USER_ID, INVESTMENT_RUN_ID)
        .then(recipe_run => {
          chai.assert.isTrue(RecipeRun.findOne.called);
          chai.assert.isTrue(investmentService.changeInvestmentRunStatus.called);
          chai.assert.isTrue(investmentService.generateRecipeDetails.called);
          chai.assert.isTrue(RecipeRunDetail.create.called);
        });
    });
  });

  describe('and method generateRecipeDetails shall', () => {
    beforeEach(() => {
      sinon.stub(assetService, 'getStrategyAssets').returns(
        Promise.resolve([
          {
            id: 28,
            symbol: "XRP",
            long_name: 'Ripple',
            is_base: false,
            is_deposit: false,
            avg_share: 7.120
          },
          {
            id: 30,
            symbol: "NMC",
            long_name: 'NameCoin',
            is_base: false,
            is_deposit: false,
            avg_share: 5.5
          }
        ])
      );
      sinon.stub(Asset, 'findAll').callsFake(() => {
        let assets = [{
            id: 2,
            symbol: "BTC",
            is_base: true
          },
          {
            id: 312,
            symbol: "ETH",
            is_base: true
          }];

        assets.map(a => {
          a.toJSON = function () {
            return this;
          };
        })

        return Promise.resolve(assets);
      });

      sinon.stub(assetService, 'getBaseAssetPrices').callsFake(() => {
        return Promise.resolve([
          {symbol: "BTC", price: "7500" },
          {symbol: "ETH", price: "550" }
        ]);
      });

      sinon.stub(assetService, 'getAssetInstruments').callsFake((asset_id) => {
        let instruments = [
          { // use exchange with id 1 as a cheapest example
            instrument_id: 1,
            quote_asset_id: asset_id,
            transaction_asset_id: 2,
            exchange_id: 1,
            average_volume: 2000,
            min_volume_requirement: 1500,
            ask_price: 0.00008955,
            bid_price: 0.00008744
          },
          {
            instrument_id: 1,
            quote_asset_id: asset_id,
            transaction_asset_id: 2,
            exchange_id: 2,
            average_volume: 2000,
            min_volume_requirement: 1500,
            ask_price: 0.00009100,
            bid_price: 0.00008700
          },
          {
            instrument_id: 2,
            quote_asset_id: 2,
            transaction_asset_id: asset_id,
            exchange_id: 3,
            average_volume: 2000,
            min_volume_requirement: 1500,
            ask_price: 11363.636363636, // 1 / 0.00008800
            bid_price: 11111.111111111, // 1 / 0.00009000 
          }
        ];

        // when query asset with id 30, add cheapest way to acquire through sell order
        if(asset_id == 30)
          instruments.push({
            instrument_id: 2,
            quote_asset_id: 2,
            transaction_asset_id: asset_id,
            exchange_id: 4,
            average_volume: 2000,
            min_volume_requirement: 1500,
            ask_price: 13363.636363636, // 1 / 0.00008800
            bid_price: 11235.95505618, // 1 / 0.00008900 
          });

        return Promise.resolve(instruments);
      });

    });
    
    afterEach(() => {
      assetService.getStrategyAssets.restore();
      Asset.findAll.restore();
      assetService.getBaseAssetPrices.restore();
      assetService.getAssetInstruments.restore();
    });

    it('shall exist', () => {
      return chai.expect(investmentService.generateRecipeDetails).to.exist;
    });

    it("shall stop if can't get base assets", () => {
      if(Asset.findAll.restore)
      Asset.findAll.restore();

      sinon.stub(Asset, 'findAll').returns(Promise.resolve());
      return chai.assert.isRejected(investmentService.generateRecipeDetails(STRATEGY_TYPE));
    });

    it("shall call getAssetInstruments to get best way to acquire asset", () => {
      return investmentService.generateRecipeDetails(STRATEGY_TYPE)
        .then(recipe => {
          chai.assert.isTrue(assetService.getAssetInstruments.called);
          chai.expect(recipe).to.satisfy(data => {
            return data.every(a => a.suggested_action.quote_asset_id == a.id);
          }, 'Asset to be acquired should be in quote_asset_id');
        });
    });

    it("shall return investment percentage for an asset", () => {
      return investmentService.generateRecipeDetails(STRATEGY_TYPE)
        .then(recipe => {
          chai.expect(recipe).to.satisfy(data => {
            return data.every(
              a => typeof a.investment_percentage==="number" && a.investment_percentage <= 100
            );
          }, 'Investment percentage should be set and be a number');
        });
    });

    it("shall throw if none of exchanges satisfy liquidity requirements of instrument", () => {
      if (assetService.getAssetInstruments.restore)
        assetService.getAssetInstruments.restore();

        sinon.stub(assetService, 'getAssetInstruments').callsFake((asset_id) => {
          let instruments = [
            { // doesn't satisfy liquidity requirement
              instrument_id: 1,
              quote_asset_id: asset_id,
              transaction_asset_id: 2,
              exchange_id: 1,
              average_volume: 2000,
              min_volume_requirement: 3000,
              ask_price: 0.00008955,
              bid_price: 0.00008744
            },
            {
              instrument_id: 1,
              quote_asset_id: asset_id,
              transaction_asset_id: 2,
              exchange_id: 2,
              average_volume: 2000,
              min_volume_requirement: 3000,
              ask_price: 0.00009100,
              bid_price: 0.00008700
            },
            {
              instrument_id: 2,
              quote_asset_id: 2,
              transaction_asset_id: asset_id,
              exchange_id: 3,
              average_volume: 2000,
              min_volume_requirement: 3000,
              ask_price: 11363.636363636, // 1 / 0.00008800
              bid_price: 11111.111111111, // 1 / 0.00009000 
            }
          ];
  
          return Promise.resolve(instruments);
        });

      return chai.assert.isRejected(investmentService.generateRecipeDetails(STRATEGY_TYPE));
    });
  });
});