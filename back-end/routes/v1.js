const express = require("express");
const router = express.Router();

const UserController = require("./../controllers/UserController");
const SecurityController = require('./../controllers/SecurityController');
const AssetController = require('./../controllers/AssetController');
const InvestmentController = require('./../controllers/InvestmentController');
const OrdersController = require('./../controllers/OrdersController');
const SystemController = require('./../controllers/SystemController');
const InstrumentController = require('./../controllers/InstrumentController');
const DepositController = require('./../controllers/DepositController');
const ColdstorageController = require('./../controllers/ColdstorageController');
const ExchangeController = require('./../controllers/ExchangeController');
const ActionLogControler = require('./../controllers/ActionLogController');
const MockController = require('./../controllers/MockController');

// const custom 	        = require('./../middleware/custom');

const passport = require("passport");
require("./../middleware/check_session")(passport);
const path = require("path");
const check_permissions = require("../middleware/check_permissions")
  .check_permissions;
const content_json = require("../middleware/content_json_header").content_json;
const filter_reducer = require('../middleware/resolve_list_filter').resolve_list_filter;
//validate POSTed body of request object using rules defined in config/validators.js
//not intended to validate filters, DON'T use in same stack filter_reduced
const post_body_validator = require('../middleware/post_body_validator').post_body_validator;
const stateless_auth = passport.authenticate("jwt", {
  session: false
});
//set new_token in response object before request is processed so a successful request
//will return new token in response
//only works if PLACED AFTER stateless_auth
const res_new_token = require('../middleware/add_new_token_response').response_token_refresh;

/* GET home page. */
router.get("/", check_permissions, function (req, res, next) {
  res.json({
    status: "success",
    message: CONFIG.disclaimer,
    data: {
      version_number: "v1.1.5"
    }
  });
});

//ROUTES is a global map set in config/system_permissions.js

router.all("*", content_json);

//USERS
router.post(
  ROUTES.Login.router_string, 
  post_body_validator,
  UserController.login);
router.get(
  ROUTES.GetUsersInfo.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  UserController.getUsers
);
router.post(
  ROUTES.GetUsersInfo.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  UserController.getUsers
);
router.get(
  ROUTES.GetUsersColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  UserController.getUsersColumnLOV
);
router.post(
  ROUTES.GetUsersColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  UserController.getUsersColumnLOV
);
router.get(
  ROUTES.GetUserInfo.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  UserController.getUser
);
router.post(
  ROUTES.ChangeUserInfo.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  post_body_validator,
  UserController.editUser
);
router.get(
  ROUTES.GetMyPermissions.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  UserController.getUserPermissions
);
router.post(
  ROUTES.InviteUser.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  post_body_validator,
  UserController.issueInvitation
);

//no auth middleware by design. 
//calls made by browser before a user exists
router.post(
  ROUTES.InvitationByToken.router_string,
  post_body_validator,
  UserController.inviteTokenInfo
);
router.post(
  ROUTES.CreateUserByInvite.router_string,
  post_body_validator,
  UserController.createByInvite
);
router.post(
  ROUTES.CreateUser.router_string, 
  post_body_validator,
  UserController.create
);
//----------------------------------------------

router.delete(
  ROUTES.DeleteUserInfo.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  UserController.deleteUser
);
router.post(
  ROUTES.ChangeUserRole.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  post_body_validator,
  UserController.changeUserRole
);

//no auth middleware by design. 
//calls made by browser when user cant login
router.post(
  ROUTES.SendPasswordResetToken.router_string,
  post_body_validator,
  UserController.sendPasswordResetToken
);
router.get(
  ROUTES.ResetPassword.router_string,
  UserController.checkPasswordResetToken
);
router.post(
  ROUTES.ResetPassword.router_string,
  post_body_validator,
  UserController.resetPassword
);
//----------------------------------------------

router.post(
  ROUTES.ChangePassword.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  post_body_validator,
  UserController.changePassword
);




//ROLES
router.post(
  ROUTES.CreateRole.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  post_body_validator,
  SecurityController.createRole
);
router.delete(
  ROUTES.DeleteRole.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  SecurityController.deleteRole
)
router.post(
  ROUTES.EditRole.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  post_body_validator,
  SecurityController.editRole
);
router.get(
  ROUTES.GetRolesInfo.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  SecurityController.getRoles
);
router.post(
  ROUTES.GetRolesInfo.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  SecurityController.getRoles
);
router.get(
  ROUTES.GetRoleInfo.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  SecurityController.getRoleInfo
);
router.get(
  ROUTES.GetAllPermissions.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  SecurityController.getAllPermissions
);


// ASSETS
router.get(
  ROUTES.GetAssetsDetailed.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  AssetController.getAssetsDetailed
);
router.post(
  ROUTES.GetAssetsDetailed.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  AssetController.getAssetsDetailed
);
router.get(
  ROUTES.GetAssetsDetailedColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  AssetController.getAssetsColumnLOV
);
router.post(
  ROUTES.GetAssetsDetailedColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  AssetController.getAssetsColumnLOV
);
router.get(
  ROUTES.GetAssetDetailedInfo.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  AssetController.getAssetDetailed
);
router.get(
  ROUTES.GetAssets.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  AssetController.getAssets
);
router.post(
  ROUTES.GetAssets.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  AssetController.getAssets
);
router.get(
  ROUTES.GetAssetInfo.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  AssetController.getAsset
);
router.post(
  ROUTES.ChangeAssetStatus.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  post_body_validator,
  AssetController.changeAssetStatus
);


// INVESTMENT
router.post(
  ROUTES.CreateInvestment.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  post_body_validator,
  InvestmentController.createInvestmentRun
);
//get filtered investments
router.post(
  ROUTES.GetInvestments.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InvestmentController.getInvestmentRuns
);
router.get(
  ROUTES.GetInvestmentPortfolioStats.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  InvestmentController.GetInvestmentPortfolioStats
);
router.get(
  ROUTES.GetInvestmentsColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InvestmentController.getInvestmentRunsColumnLOV
);
router.post(
  ROUTES.GetInvestmentsColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InvestmentController.getInvestmentRunsColumnLOV
);
router.get(
  ROUTES.GetInvestment.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  InvestmentController.getInvestmentRun
);
router.post(
  ROUTES.GetInvestmentStats.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  InvestmentController.getInvestmentStats
);


// RECIPE RUNS
router.post(
  ROUTES.ApproveRecipeRun.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  post_body_validator,
  InvestmentController.changeRecipeRunStatus
);
router.post(
  ROUTES.CreateNewRecipeRun.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  post_body_validator,
  InvestmentController.createRecipeRun
);
router.post(
  ROUTES.GetRecipeRuns.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InvestmentController.getRecipeRuns
);
router.post(
  ROUTES.GetRecipeRunsOf.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InvestmentController.getRecipeRuns
);
router.get(
  ROUTES.GetRecipeRunsColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InvestmentController.getRecipeRunsColumnLOV
);
router.post(
  ROUTES.GetRecipeRunsColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InvestmentController.getRecipeRunsColumnLOV
);
router.get(
  ROUTES.GetRecipeRun.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InvestmentController.getRecipeRun
);


// RECIPE ORDERS
router.post(
  ROUTES.GetRecipeOrdersOfRecipe.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  OrdersController.getRecipeOrdersOfRecipe
);
router.post(
  ROUTES.GetRecipeOrdersOfGroup.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  OrdersController.getRecipeOrdersOfGroup
);
router.get(
  ROUTES.GetRecipeOrdersGroup.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  OrdersController.getRecipeOrdersGroup
);
router.get(
  ROUTES.GetRecipeOrdersGroupOfRecipe.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  OrdersController.getRecipeOrdersGroupOfRecipe
);
router.post(
  ROUTES.GetRecipeOrders.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  OrdersController.getRecipeOrders
);
router.get(
  ROUTES.GetRecipeOrdersColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  OrdersController.getRecipeOrdersColumnLOV
);
router.post(
  ROUTES.GetRecipeOrdersColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  OrdersController.getRecipeOrdersColumnLOV
);
router.get(
  ROUTES.GetRecipeOrder.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  OrdersController.getRecipeOrder
);
router.post(
  ROUTES.AlterOrdersGroup.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  post_body_validator,
  OrdersController.changeOrdersGroupStatus
);
router.post(
  ROUTES.GenerateRecipeOrders.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  OrdersController.generateRecipeRunOrders
)

// RECIPE RUN DETAILS
router.post(
  ROUTES.GetRecipeRunDetails.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InvestmentController.getRecipeRunDetails
);
router.get(
  ROUTES.GetRecipeRunDetailsColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InvestmentController.getRecipeRunDetailsColumnLOV
);
router.post(
  ROUTES.GetRecipeRunDetailsColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InvestmentController.getRecipeRunDetailsColumnLOV
);
router.get(
  ROUTES.GetRecipeRunDetail.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InvestmentController.getRecipeRunDetail
);

// Recipe Run deposits
router.post(
  ROUTES.SubmitRecipeRunDeposit.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  post_body_validator,
  DepositController.submitDeposit
);
router.post(
  ROUTES.ApproveRecipeRunDeposit.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  post_body_validator,
  DepositController.approveDeposit
);
router.post(
  ROUTES.GetRecipeRunDepositsOf.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  DepositController.getRecipeDeposits
);
router.post(
  ROUTES.GetInvestmentRunDepositsOf.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  DepositController.getInvestmentRunDeposits
);
router.post(
  ROUTES.GetRecipeRunDeposits.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  DepositController.getRecipeDeposits
);
router.get(
  ROUTES.GetRecipeRunDepositsColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  DepositController.getRecipeDepositsColumnLOV
);
router.post(
  ROUTES.GetRecipeRunDepositsColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  DepositController.getRecipeDepositsColumnLOV
);
router.get(
  ROUTES.GetRecipeRunDeposit.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  DepositController.getRecipeDeposit
);

 // Execution orders
router.post(
  ROUTES.GetExecutionOrdersOfRecipeOrder.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InvestmentController.getExecutionOrdersOfRecipeOrder
);
router.post(
  ROUTES.GetExecutionOrdersOfInvestmentRun.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InvestmentController.getExecutionOrdersOfInvestmentRun
);
router.post(
  ROUTES.GetExecutionOrders.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InvestmentController.getExecutionOrders
);
router.get(
  ROUTES.ExecutionOrdersColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InvestmentController.getExecutionOrdersColumnLOV
);
router.post(
  ROUTES.ExecutionOrdersColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InvestmentController.getExecutionOrdersColumnLOV
);
router.get(
  ROUTES.GetExecutionOrder.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  InvestmentController.getExecutionOrder
);
router.post(
  ROUTES.ChangeExecutionOrderStatus.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  InvestmentController.changeExecutionOrderStatus
);

 // Execution order fills
router.post(
  ROUTES.GetExecutionOrdersFillsOf.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InvestmentController.getExecutionOrderFills
);
router.get(
  ROUTES.ExecutionOrdersFillColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InvestmentController.getExecutionOrderFillsColumnLOV
);
router.post(
  ROUTES.ExecutionOrdersFillColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InvestmentController.getExecutionOrderFillsColumnLOV
);
router.get(
  ROUTES.GetExecutionOrdersFill.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  InvestmentController.getExecutionOrderFill
);

// Instruments
router.post(
  ROUTES.InstrumentCreate.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  post_body_validator,
  InstrumentController.createInstrument
);
router.get(
  ROUTES.GetInstruments.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InstrumentController.getInstruments
);
router.post(
  ROUTES.GetInstruments.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InstrumentController.getInstruments
);
router.get(
  ROUTES.GetInstrumentsColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InstrumentController.getInstrumentsColumnLOV
);
router.post(
  ROUTES.GetInstrumentsColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InstrumentController.getInstrumentsColumnLOV
);
router.get(
  ROUTES.GetExchangeInstrumentIDs.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  InstrumentController.getIdentifiersForInstrument
);
router.get(
  ROUTES.GetInstrument.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  InstrumentController.getInstrument
);
router.post(
  ROUTES.InstrumentCheckMapping.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  post_body_validator,
  InstrumentController.checkInstrumentExchangeMap
);
router.post(
  ROUTES.InstrumentMapExchanges.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  post_body_validator,
  InstrumentController.mapInstrumentsWithExchanges
);
router.get(
  ROUTES.GetInstrumentExchanges.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  InstrumentController.getInstrumentExchanges
);
router.delete(
  ROUTES.RemoveInstrumentExchangeMapping.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  InstrumentController.removeInstrumentExchangeMapping
);

// Liquidity requirements
router.post(
  ROUTES.LiquidityReqCreate.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  post_body_validator,
  InstrumentController.createLiquidityRequirement
);
router.get(
  ROUTES.GetLiquidityRequirements.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  InstrumentController.getLiquidityRequirements
);
router.post(
  ROUTES.GetLiquidityRequirements.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InstrumentController.getLiquidityRequirements
);
router.get(
  ROUTES.GetLiquidityRequirementsColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InstrumentController.getLiquidityRequirementsColumnLOV
);
router.post(
  ROUTES.GetLiquidityRequirementsColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  InstrumentController.getLiquidityRequirementsColumnLOV
);
router.get(
  ROUTES.GetLiquidityRequirement.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  InstrumentController.getLiquidityRequirement
);
router.get(
  ROUTES.GetLiquidityRequirementExchanges.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  InstrumentController.getLiquidityRequirementExchanges
);

// System Settings
router.post(
  ROUTES.ChangeSettingValues.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  post_body_validator,
  SystemController.changeSettingValue
);
router.get(
  ROUTES.ViewSettingValues.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  SystemController.getAllSettings
);


// Route to check auth and get values. Front-end needs
router.get(
  ROUTES.CheckAuth.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  UserController.checkAuth
);
router.get(
  ROUTES.Logout.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  UserController.logout
);

//Exchanges
router.get(
  ROUTES.GetExchanges.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  ExchangeController.getExchanges
);
router.post(
  ROUTES.GetExchanges.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  ExchangeController.getExchanges
);
router.get(
  ROUTES.InstrumentMapExchanges.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  MockController.getExchanges
);
router.post(
  ROUTES.InstrumentMapExchanges.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  MockController.getExchanges
);
router.post(
  ROUTES.CreateExchangeAccount.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  ExchangeController.createExchangeAccount
);

//COLD STORAGE
router.post(
  ROUTES.GetColdStorageTransfers.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  ColdstorageController.getColdStorageTransfers
);
router.post(
  ROUTES.GetColdStorageTransfersColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  ColdstorageController.getColdStorageTransferColumnLOV
);
router.post(
  ROUTES.ApproveColdStorageTransfer.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  ColdstorageController.approveColdStorageTransfer
);
router.post(
  ROUTES.GetColdStorageCustodians.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  ColdstorageController.getCustodians
);
router.post(
  ROUTES.AddColdStorageCustodians.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  ColdstorageController.addCustodian
);
router.post(
  ROUTES.GetColdStorageCustodiansColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  MockController.fetchColLOV
);
router.post(
  ROUTES.AddColdstorageAccount.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  ColdstorageController.addColdstorageAccount
);
router.post(
  ROUTES.GetColdstorageAccounts.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  filter_reducer,
  ColdstorageController.getColdstorageAccounts
);
router.post(
  ROUTES.GetColdstorageAccountsColLOV.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  MockController.fetchColLOV
);
router.post(
  ROUTES.GetColdstorageAccountsFees.router_string,
  stateless_auth,
  res_new_token,
  check_permissions,
  ColdstorageController.getColdstorageAccountsFees
);
//********* API DOCUMENTATION **********
router.use(
  "/docs/api.json",
  express.static(path.join(__dirname, "/../public/v1/documentation/api.json"))
);
router.use(
  "/docs",
  express.static(path.join(__dirname, "/../public/v1/documentation/dist"))
);

//********* SYSTEM TEST COVERAGE *********
router.use(
  '/coverage',
  express.static(path.join(__dirname, '/../public/coverage'))
);

//********* FE TRANSLATIONS **********
router.use(
  "/fe/i18n",
  express.static(path.join(__dirname, "/../public/fe/i18n"))
);
module.exports = router;