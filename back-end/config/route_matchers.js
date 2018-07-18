ROUTE_MATCHERS = {
    CreateUser: /\/users\/create$/,
    InviteUser: /\/users\/invite/,
    DeleteUserInfo: /\users\/rm\/(\d+|me)$/,
    InvitationByToken: /\/users\/invitation/,
    CreateUserByInvite: /\/users\/create-invited/,
    Login: /\/users\/login/,
    GetMyPermissions: /\/users\/me\/permissions/,
    GetUserInfo: /\/users\/(\d+|me)$/,
    GetUsersInfo: /\/users\/all\/list/,
    GetUsersColLOV: /\/users\/header_lov\/\w+$/,
    ChangeUserInfo: /\/users\/(\d+|me)\/edit/,
    ChangeUserRole: /\/users\/(\d+|me)\/change_role/,
    ChangePassword: /\/users\/(\d+|me)\/change_password/,
    SendPasswordResetToken: /\/send_reset_token/,
    ResetPassword: /\/password_reset\/\w+/,
    GetRoleInfo: /\/roles\/\d+$/,
    GetRolesInfo: /\/roles\/all/,
    EditRole: /\/roles\/\d+\/edit/,
    CreateRole: /\/roles\/create/,
    DeleteRole: /\/roles\/\d+\/delete/,
    GetAllPermissions: /\/permissions\/list/,
    GetAssetInfo: /\/assets\/\d+$/,
    GetAssets: /\/assets\/all$/,
    GetAssetDetailedInfo: /\/assets\/detailed\/\d+$/,
    GetAssetsDetailed: /\/assets\/detailed\/all$/,
    GetAssetsDetailedColLOV: /\/assets\/detailed\/header_lov\/\w+$/,
    ChangeAssetStatus: /\/assets\/\d+\/change_status$/,
    CreateInvestment: /\/investments\/create$/,
    GetInvestment: /\/investments\/\d+$/,
    GetInvestments: /\/investments\/all$/,
    GetInvestmentsColLOV: /\/investments\/header_lov\/\w+/,
    GetRecipeRun: /\/recipes\/\d+$/,
    GetRecipeRuns: /\/recipes\/of_investment\/\d+$/,
    GetRecipeRunsColLOV: /\/recipes\/header_lov\/\w+/,
    GetRecipeRunDetail: /\/recipe_details\/\d+$/,
    GetRecipeRunDetails: /\/recipe_details\/of_recipe\/\d+$/,
    GetRecipeRunDetailsColLOV: /\/recipe_details\/header_lov\/\w+/,
    ApproveRecipeRun: /\/recipes\/\d+\/approve$/,
    GetRecipeOrders: /\/orders\/of_recipe\/d+$/,
    GetRecipeOrdersColLOV: /\/orders\/header_lov\/\w+/,
    GetRecipeOrder: /\/orders\/d+$/,
    AlterOrdersGroup: /\/orders\/d+\/alter$/,
    CreateNewRecipeRun: /\/investments\/\d+\/create_recipe$/,
    CreateDeposit: /\/investments\/\d+\/deposit$/,
    GetRecipeRunDeposits: /\/recipe_deposits\/of_recipe\/\d+$/,
    GetRecipeRunDepositsColLOV: /\/recipe_deposits\/header_lov\/\w+/,
    GetRecipeRunDeposit: /\/recipe_deposits\/\d+$/,
    GetExecutionOrders: /\/execution_orders\/of_order\/\d+$/,
    ExecutionOrdersColLOV: /\/execution_orders\/header_lov\/\w+/,
    GetExecutionOrder: /\/execution_orders\/\d+$/,
    GetExecutionOrdersFills: /\/exec_orders_fills\/of_order\/\d+$/,
    ExecutionOrdersFillColLOV: /\/exec_orders_fills\/header_lov\/\w+/,
    GetExecutionOrdersFill: /\/exec_orders_fills\/\d+$/,
    InstrumentCreate: /\/instruments\/create/,
    GetInstrument: /\/instruments\/\d+$/,
    GetInstruments: /\/instruments\/all$/,
    GetInstrumentsColLOV: /\/instruments\/header_lov\/\w+/,
    InstrumentCheckMapping: /\/instruments\/\d+\/check_mapping$/,
    InstrumentMapExchanges: /\/instruments\/\d+\/add_mapping$/,
    GetInstrumentExchanges: /\/instruments\/\d+\/exchanges$/,
    LiquidityReqCreate: /\/liquidity_requirements\/create$/,
    GetLiquidityRequirement: /\/liquidity_requirements\/\d+$/,
    GetLiquidityRequirements: /\/liquidity_requirements\/all$/,
    GetLiquidityRequirementsColLOV: /\/liquidity_requirements\/header_lov\/\w+/,
    GetLiquidityRequirementExchanges: /\/liquidity_requirements\/\d+\/exchanges$/,
    ChangeSettingValues: /\/settings\/\d+$/,
    ViewSettingValues: /\/settings$/,
    CheckAuth: /\/users\/login\/check$/,
}

//same as above map but with regex strings that can be converted into regex objects
ROUTE_STRINGS = _.mapValues(ROUTE_MATCHERS, route_regex => {
    const regex_string = route_regex.toString();
    console.log(`Importing route: ${regex_string}`);
    const regex_string_length = regex_string.length;

    return regex_string.substring(1, regex_string_length - 1);
});