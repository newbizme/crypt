# CryptX DB schema

user # User of the CryptX system
-
id PK int
first_name nvarchar
last_name nvarchar
email nvarchar
password nvarchar # Hashed and salted password
created_timestamp timestamp
reset_password_token_hash nvarchar NULLABLE # Hash of email confirmation token that was sent to user's email
reset_password_token_expiry_timestamp timestamp NULLABLE # Timestamp when email confirmation token expires
is_active bool # True - user is active, False - user is disabled

user_session # User's session that is identified by an authentication token
-
id PK int
user_id int FK >- user.id # User to whom the session belongs
token varchar # Bearer token which gives user access to the session
expiry_timestamp timestamp # Time when session will expire
ip_address varchar # IP address which was used to start the session

permission # Table that contains all the permissions available in the system
-
id enum UNIQUE # Identifier of the permission that maps it to the source code of the system
name varchar # User friendly name of the permission

role # Table that contains all the roles available in the system
-
id PK int
name varchar # User friendly name of the role

role_permission # Determines which permissions are available for users of a given role
-
role_id PK int FK >- role.id
permission_id PK enum FK >- permission.id

user_role # This table maps users to roles that are enabled for them
-
user_id int FK >- user.id
role_id int FK >- role.id

instrument # Tradable instrument (symbol)
-
id PK int
symbol nvarchar # Symbol, e.g. BTC
long_name nvarchar # User friendly name of the symbol, e.g. Bitcoin
is_base bool # True - if it is a base currency, False - if not
is_deposit bool # True - if it is a desposit currency

instrument_blockchain # This mapping will exist for blockchain based instruments, e.g. Bitcoin
-
id PK int
instrument_id int FK >- instrument.id
coinmarketcap_identifier nvarchar # Identifier in coinmarketcap system

instrument_liquidity_requirement # This table is used to define minimum liquidity requirements for exchanges
-
id PK int
instrument_id int FK >- instrument.id
minimum_volume decimal # Minimum volume
periodicity_in_days int

instrument_status_change
-
id PK int
timestamp timestamp # Time and date when the change was made
instrument_id FK >- instrument.id
user_id int NULLABLE FK >- user.id # User who initiated this action. NULL if initated by the system
comment nvarchart # Comment that can be provided by the user initiating the status change
type enum # Type of change: Whitelisting, Blacklisting, Graylisting

exchange # This table contains exchanges will be used for investing
-
id PK int
name varchar

instrument_exchange_mapping # This table determines which instruments are available on which exchanges
-
instrument_id PK int FK >- instrument.id
exchange_id PK int FK >- exchange.id
external_instrument_id varchar
tick_size decimal # Determines minimum price change of the instrument on this exchange

exchange_account # This table defines accounts available on each exchange
-
id PK int
exchange_id int FK >- exchange.id # Exchange on which the account is based
instrument_id int FK >- instrument.id # Instrument in which acount is denominated
account_type enum
external_identifier varchar # External identifier of the account, e.g. account's address

cold_storage_account # This table defines accounts available for cold storage of cryptocurrencies
-
id PK int
instrument_id int FK >- instrument.id
strategy_type enum # Strategy type for which this account is used. Possible values: Large Cap Index (LCI), Mid Cap Index (MCI)
address nvarchar # Address that can be used to send the coins to this cold storage account

market_history_input # This table will contain market history retrieved from Coinmarketcap
-
int FK id
timestamp timestamp # Timestamp when the information was retrieved
instrument_id FK int FK >- instrument.id # Instrument for which the infromation was retrieved
price_usd decimal # Price of the instrument in USD
market_cap_usd decimal # Total market capitalization of the instrument in USD
daily_volume_usd decimal # Total daily volume of the instrument in USD
market_cap_percentage decimal # Market cap of the instrument as percentage of total capitalization of whole market

market_history_calculation
-
int FK id
timestamp timestamp # Timestamp when the information was calculated
instrument_id FK int FK >- instrument.id # Instrument for which the infromation was retrieved
type enum # Type of the calculated property. Possible values: 0 - Network Value to Transactions ratio, measures the dollar value of cryptoasset transaction activity relative to network value
value decimal

investment_run # Investment workflow run
-
id PK int
started_timestamp timestamp # Time when the run was initiated
updated_timestamp timestamp # Last time when the run was updated
completed_timestamp timestamp NULLABLE # Timestamp when the run was completed, e.g. reached its terminal state
user_created_id int FK >- user.id # User which initiated the investment run
strategy_type enum # Large Cap Index (LCI), Mid Cap Index (MCI)
is_simulated bool # True if investment run is simulated, e.g. will not place real orders
status enum # Status of the investment run: Initiated, RecipeRun, RecipeApproved, DepositsCompleted, OrdersGenerated, OrdersApproved, OrdersExecuting, OrdersFilled

investment_run_deposit # Funds deposited for investing during single investment run
-
id PK int
investment_run_id int FK >- investment_run.id
instrument_id int # Currency in which the investment was denominated
amount decimal # Total amount invested for this instrument

recipe_run
-
id PK int
created_timestamp timestamp # Time when recipe run was initiated
investment_run_id int FK >- investment_run.id
user_created_id int FK >- user.id # User which initiated the recipe run
approval_status enum # Possible statuses are Pending, Approved, Rejected
approval_user_id int FK >- user.id # User who approved/rejected the recipe run
approval_timestamp timestamp # Time and date when the user approved this recipe run
approval_comment nvarchar # Comment that should be provided when approving the recipe run

recipe_run_detail
-
id PK int
recipe_run_id int FK >- recipe_run.id
base_instrument_id int FK >- instrument.id
target_instrument_id int FK >- instrument.id
target_exchange_id int FK >- exchange.id # The trading exchange on which trading is suggested acording the recipe run
investment_percentage decimal # Percentage that will be invested this way

recipe_order_group
-
id PK int
created_timestamp timestamp # Time when recipe order has been placed
approval_status enum # Possible statuses are Pending, Approved, Rejected
approval_user_id int FK >- user.id # User who approved/rejected the recipe order group
approval_timestamp timestamp # Time and date when the user approved this recipe order group
approval_comment nvarchar # Comment that should be provided when approving the order group

recipe_order
-
id PK int
recipe_order_group_id int FK >- recipe_order_group.id
base_instrument_id int FK >- instrument.id
target_instrument_id int FK >- instrument.id
target_exchange_id int FK >- exchange.id # The trading exchange on which trading is suggested acording the recipe run
price # Market price when the recipe order was placed
status enum # Possible statuses are Pending, Executing, Completed, Rejected (by the user), Cancelled (manual intervention by user), Failed (due to technical issue which does not allow to continue)

execution_order
-
id PK int
recipe_order_id int FK >- recipe_order.id
status enum # Pending, Placed, FullyFilled, PartiallyFilled, Cancelled, Failed
type enum # Market, Limit, Stop
price decimal # order price
total_quantity decimal # Order size
placed_timestamp # Time the execution order has been placed
completed_timestamp # Time the execution order was fully filled or cancelled

execution_order_fill
-
id PK int
timestamp # Time of the fill
execution_order_id int FK >- execution_order.id
quantity decimal
price decimal # fill price

cold_storage_order
-
id PK int
execution_order_id PK int FK >- execution_order.id # ID of the order for fills of which cold storage is needed
status enum # Pending - order was generated internally, but not yet sent, Sent - recipe order was sent to exchange or blockchain (waiting confirmation), Completed - when order reaches its final successful state, Failed - system failed to execute the order
placed_timestamp timestamp # Time when the order was generated
completed_timestamp timestamp # Time when the order reached its final state
cold_storage_account_id int # ID of the cold storage account to which the transfer will be made

action_log
# This table will log all actions of users and the system itself
-
id PK int # ID of the action 
timestamp timestamp # Timestamp when the action happened
performing_user_id int # User who performed the action
user_session_id int # User session during which the action was performed 
user_id int # Another user who was affected by the action
permission_id int # Permission which is related to the action
role_id int # Role which is related to the action
instrument_id int # Instrument which is related to the action
exchange_id int # Exchange which is related to the action
exchange_account_id int # Exchange account related to the action
investment_run_id int # Investment run related to the action
recipe_run_id int # Recipe run related to the action
recipe_order_id int # Recipe order related to the action
execution_order_id int # Execution order related to the action
details nvarchar # More detailed information about the action

setting
# This table will contain system settings (controlled by admins via web interface)
-
id PK int
key string # Key that identifies the setting
vaue string # Value of the setting

exchange_liquidity_history
# This table will contain 
-
id PK int
date date # Date for which liquidity was measured
exchange_id int FK >- exchange.id
base_instrument_id int FK >- instrument.id
target_instrument_id int FK >- instrument.id
volume decimal