'use strict';

require('../ccxt.js');
var ripio$1 = require('./abstract/ripio.js');
var errors = require('./base/errors.js');
var number = require('./base/functions/number.js');
var Precise = require('./base/Precise.js');

//  ---------------------------------------------------------------------------
//  ---------------------------------------------------------------------------
class ripio extends ripio$1 {
    describe() {
        return this.deepExtend(super.describe(), {
            'id': 'ripio',
            'name': 'Ripio',
            'countries': ['AR', 'BR'],
            'rateLimit': 50,
            'version': 'v4',
            'pro': true,
            'has': {
                'CORS': false,
                'spot': true,
                'margin': false,
                'swap': false,
                'future': false,
                'option': false,
                'cancelOrder': true,
                'createOrder': true,
                'fetchBalance': true,
                'fetchCanceledOrders': true,
                'fetchClosedOrders': true,
                'fetchCurrencies': true,
                'fetchL2OrderBook': true,
                'fetchMarkets': true,
                'fetchMyTrades': true,
                'fetchOHLCV': false,
                'fetchOpenInterest': false,
                'fetchOpenOrders': true,
                'fetchOrder': true,
                'fetchOrderBook': true,
                'fetchOrders': true,
                'fetchTicker': true,
                'fetchTickers': true,
                'fetchTrades': true,
                'withdraw': true,
            },
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1892491/179565296-42198bf8-2228-47d6-a1b5-fd763a163c9d.jpg',
                'api': {
                    'public': 'https://api.ripiotrade.co/v4/public',
                    'private': 'https://api.ripiotrade.co/v4',
                },
                'www': 'https://trade.ripio.com',
                'doc': [
                    'https://apidocs.ripiotrade.co/v4',
                ],
            },
            'api': {
                'public': {
                    'get': [
                        'tickers/',
                        'tickers/{pair}/',
                        'orders/level-3/',
                        'orders/level-2/',
                        'trades/',
                        'currencies/',
                        'pairs/',
                    ],
                },
                'private': {
                    'get': [
                        'book/summaries/',
                        'book/estimate-price/{pair}/',
                        'book/orders/level-3/',
                        'book/orders/level-2/',
                        'user/balances/',
                        'user/fees-and-limits/',
                        'user/statement/',
                        'user/statement/{currency_code}/',
                        'user/trades/',
                        'orders/',
                        'orders/open/',
                        'orders/{id}/',
                        'orders/by-external-id/{external_id}/',
                        'deposits/',
                        'withdrawals/',
                        'withdrawals/estimate-fee/{currency_code}/',
                        'wallets/is-internal/',
                        'wallets/balance/',
                        'wallets/balance/{date}/',
                    ],
                    'post': [
                        'orders/',
                        'withdrawals/',
                        'transactions/sync/',
                        'ticket/',
                    ],
                    'delete': [
                        'orders/',
                        'orders/by-external-id/',
                        'orders/all/',
                    ],
                },
            },
            'fees': {
                'trading': {
                    'tierBased': true,
                    'percentage': true,
                    'taker': 0.0 / 100,
                    'maker': 0.0 / 100,
                },
            },
            'precisionMode': number.TICK_SIZE,
            'requiredCredentials': {
                'apiKey': true,
                'secret': false,
            },
            'exceptions': {
                'exact': {
                    '400': errors.InvalidOrder,
                    '401': errors.PermissionDenied,
                    '402': errors.AuthenticationError,
                    '403': errors.PermissionDenied,
                    '404': errors.NullResponse,
                    '405': errors.ExchangeError,
                    '429': errors.DDoSProtection,
                    '500': errors.ExchangeError,
                    '502': errors.NetworkError,
                    '503': errors.OnMaintenance,
                },
                'broad': {
                    'You did another transaction with the same amount in an interval lower than 10 (ten) minutes, it is not allowed in order to prevent mistakes. Try again in a few minutes': errors.ExchangeError,
                    'Invalid order quantity': errors.InvalidOrder,
                    'Funds insufficient': errors.InsufficientFunds,
                    'Order already canceled': errors.InvalidOrder,
                    'Order already completely executed': errors.OrderNotFillable,
                    'No orders to cancel': errors.OrderNotFound,
                    'Minimum value not reached': errors.ExchangeError,
                    'Limit exceeded': errors.DDoSProtection,
                    'Too many requests': errors.RateLimitExceeded,
                },
            },
        });
    }
    async fetchMarkets(params = {}) {
        /**
         * @method
         * @name ripio#fetchMarkets
         * @description retrieves data on all markets for ripio
         * @param {object} params extra parameters specific to the exchange api endpoint
         * @returns {[object]} an array of objects representing market data
         */
        const response = await this.publicGetPairs(params);
        //
        //     {
        //         "data": [
        //             {
        //                 "base": "ETH",
        //                 "base_name": "Ethereum",
        //                 "enabled": true,
        //                 "min_amount": 0.0024,
        //                 "min_value": 5,
        //                 "price_tick": 1,
        //                 "quote": "USDC",
        //                 "quote_name": "USD Coin",
        //                 "symbol": "ETH_USDC"
        //             },
        //         ],
        //         "message": null
        //     }
        //
        const result = [];
        const results = this.safeValue(response, 'data', []);
        for (let i = 0; i < results.length; i++) {
            const market = results[i];
            const id = this.safeString(market, 'symbol');
            const baseId = this.safeString(market, 'base');
            const quoteId = this.safeString(market, 'quote');
            const base = this.safeCurrencyCode(baseId);
            const quote = this.safeCurrencyCode(quoteId);
            const symbol = base + '/' + quote;
            const precision = {
                'amount': this.safeNumber(market, 'min_amount'),
                'price': this.safeNumber(market, 'price_tick'),
            };
            const limits = {
                'amount': {
                    'min': this.safeNumber(market, 'min_amount'),
                    'max': undefined,
                },
                'price': {
                    'min': undefined,
                    'max': undefined,
                },
                'cost': {
                    'min': this.safeNumber(market, 'min_value'),
                    'max': undefined,
                },
                'leverage': {
                    'min': undefined,
                    'max': undefined,
                },
            };
            const active = this.safeValue(market, 'enabled', true);
            const maker = 0.0025;
            const taker = 0.005;
            result.push({
                'id': id,
                'symbol': symbol,
                'base': base,
                'quote': quote,
                'baseId': baseId,
                'quoteId': quoteId,
                'type': 'spot',
                'spot': true,
                'active': active,
                'precision': precision,
                'maker': maker,
                'taker': taker,
                'limits': limits,
                'settle': undefined,
                'settleId': undefined,
                'margin': false,
                'swap': false,
                'future': false,
                'option': false,
                'contract': false,
                'linear': undefined,
                'inverse': undefined,
                'contractSize': undefined,
                'expiry': undefined,
                'expiryDatetime': undefined,
                'strike': undefined,
                'optionType': undefined,
                'info': market,
            });
        }
        return result;
    }
    async fetchCurrencies(params = {}) {
        /**
         * @method
         * @name ripio#fetchCurrencies
         * @description fetches all available currencies on an exchange
         * @param {object} params extra parameters specific to the ripio api endpoint
         * @returns {object} an associative dictionary of currencies
         */
        const response = await this.publicGetCurrencies(params);
        //
        //     {
        //         "data": [
        //             {
        //                 "active": true,
        //                 "code": "1INCH",
        //                 "id": "8c2b7f2a-31ed-4be1-8645-5232ac7de8fe",
        //                 "min_withdraw_amount": 1,
        //                 "name": "1inch",
        //                 "precision": 8,
        //                 "can_deposit": true,
        //                 "can_withdraw": true
        //             },
        //         ],
        //         "message": null
        //     }
        //
        const results = this.safeValue(response, 'data', []);
        const result = {};
        for (let i = 0; i < results.length; i++) {
            const currency = results[i];
            const id = this.safeString(currency, 'id');
            const code = this.safeCurrencyCode(this.safeString(currency, 'code'));
            const name = this.safeString(currency, 'name');
            const active = this.safeValue(currency, 'active', true);
            const precision = this.safeInteger(currency, 'precision');
            const min_withdraw_amount = this.safeInteger(currency, 'min_withdraw_amount');
            result[code] = {
                'id': id,
                'code': code,
                'name': name,
                'info': currency,
                'active': active,
                'fee': undefined,
                'precision': precision,
                'limits': {
                    'amount': { 'min': undefined, 'max': undefined },
                    'withdraw': { 'min': min_withdraw_amount, 'max': undefined },
                },
            };
        }
        return result;
    }
    async fetchTicker(symbol, params = {}) {
        /**
         * @method
         * @name ripio#fetchTicker
         * @description fetches a price ticker, a statistical calculation with the information calculated over the past 24 hours for a specific market
         * @param {string} symbol unified symbol of the market to fetch the ticker for
         * @param {object} params extra parameters specific to the ripio api endpoint
         * @returns {object} a [ticker structure]{@link https://docs.ccxt.com/#/?id=ticker-structure}
         */
        if (symbol === undefined) {
            throw new errors.ArgumentsRequired(this.id + ' fetchTicker() requires a symbol argument');
        }
        await this.loadMarkets();
        symbol = this.symbol(symbol);
        const request = {
            'pair': this.marketId(symbol),
        };
        const response = await this.publicGetTickersPair(this.extend(request, params));
        //
        //     {
        //         "message": null,
        //         "data": {
        //             "ask": 95629,
        //             "base_code": "BTC",
        //             "base_id": "9A5E2EF4-9547-418A-8EC6-C6EADBB8B32F",
        //             "bid": 94171,
        //             "date": "2022-11-11T01:31:35.820Z",
        //             "high": 98444,
        //             "is_frozen": false,
        //             "last": 94311,
        //             "low": 85034,
        //             "pair": "BTC_BRL",
        //             "price_change_percent_24h": "-12",
        //             "quote_id": "48898138-8623-4555-9468-B1A1505A9352",
        //             "quote_code": "BRL",
        //             "quote_volume": 150.1,
        //             "trades_quantity": 1199,
        //             "volume": 27.26776846
        //         }
        //     }
        //
        const ripioTicker = this.safeValue(response, 'data', {});
        const ticker = this.parseTicker(ripioTicker, symbol);
        return ticker;
    }
    async fetchTickers(symbols = undefined, params = {}) {
        /**
         * @method
         * @name ripio#fetchTickers
         * @description fetches price tickers for multiple markets, statistical calculations with the information calculated over the past 24 hours each market
         * @param {[string]|undefined} symbols not used by ripio fetchTickers
         * @param {object} params not used by ripio fetchTickers
         * @returns {object} a dictionary of [ticker structures]{@link https://docs.ccxt.com/#/?id=ticker-structure}
         */
        await this.loadMarkets();
        const response = await this.publicGetTickers();
        //
        //     {
        //         "message": null,
        //         "data": [
        //             {
        //                 "ask": 250000.15,
        //                 "base_code": "BTC",
        //                 "base_id": "9A5E2EF4-9547-418A-8EC6-C6EADBB8B32F",
        //                 "bid": 240000.15,
        //                 "date": "2017-10-20T00:00:00Z",
        //                 "high": 250000.15,
        //                 "is_frozen": false,
        //                 "last": 245000.15,
        //                 "low": 200000.15,
        //                 "pair": "BTC_BRL",
        //                 "price_change_percent_24h": "-12",
        //                 "quote_code": "BRL",
        //                 "quote_id": "48898138-8623-4555-9468-B1A1505A9352",
        //                 "quote_volume": 150.1,
        //                 "trades_quantity": 123,
        //                 "volume": 123.12345678
        //             },
        //         ]
        //     }
        //
        const ripioTickers = this.safeValue(response, 'data', []);
        const tickers = {};
        const ripioTickersLength = ripioTickers.length;
        for (let i = 0; i < ripioTickersLength; i++) {
            const ticker = ripioTickers[i];
            const parsedTicker = this.parseTicker(ticker);
            tickers[parsedTicker['symbol']] = parsedTicker;
        }
        return tickers;
    }
    async fetchOrderBook(symbol, limit = undefined, params = {}) {
        /**
         * @method
         * @name ripio#fetchOrderBook
         * @description fetches information on open orders with bid (buy) and ask (sell) prices, volumes and other data
         * @param {string} symbol unified symbol of the market to fetch the order book for
         * @param {int|undefined} limit not used by ripio fetchOrderBook
         * @param {object} params extra parameters specific to the ripio api endpoint
         * @returns {object} a dictionary of [order book structures]{@link https://docs.ccxt.com/#/?id=order-book-structure} indexed by market symbols
         */
        await this.loadMarkets();
        symbol = this.symbol(symbol);
        params = this.extend(params, { 'pair': this.marketId(symbol) });
        const response = await this.publicGetOrdersLevel3(params);
        //
        //     {
        //         "message": null,
        //         "data": {
        //             "timestamp": 1675708481219,
        //             "asks": [
        //                 {
        //                     "amount": 0.01187517,
        //                     "id": "554F2D70-04B9-4E26-9548-9C35B025A018",
        //                     "price": 14704.45
        //                 },
        //             ],
        //             "bids": [
        //                 {
        //                     "amount": 0.46097295,
        //                     "id": "E6D05F51-D79B-47CF-84C5-B157120EBC25",
        //                     "price": 14650.25
        //                 },
        //             ]
        //         }
        //     }
        //
        const timestamp = this.safeInteger(response, 'timestamp');
        const orderbook = this.parseOrderBook(response['data'], symbol, timestamp, 'bids', 'asks', 'price', 'amount');
        return orderbook;
    }
    async fetchL2OrderBook(symbol, limit = undefined, params = {}) {
        /**
         * @method
         * @name ripio#fetchL2OrderBook
         * @description fetches level 2 information on open orders with bid (buy) and ask (sell) prices, volumes and other data
         * @param {string} symbol unified symbol of the market to fetch the order book for
         * @param {int|undefined} limit not used by ripio fetchL2OrderBook
         * @param {object} params extra parameters specific to the ripio api endpoint
         * @returns {object} a dictionary of [order book structures]{@link https://docs.ccxt.com/#/?id=order-book-structure} indexed by market symbols
         */
        await this.loadMarkets();
        symbol = this.symbol(symbol);
        params = this.extend(params, { 'pair': this.marketId(symbol) });
        const response = await this.publicGetOrdersLevel2(params);
        //
        //     {
        //         "data": {
        //             "asks": [
        //                 {
        //                     "amount": 1,
        //                     "price": 10322
        //                 },
        //             ],
        //             "bids": [
        //                 {
        //                     "amount": 1.4550699999999999,
        //                     "price": 10273
        //                 },
        //             ],
        //             "timestamp": 1681738465751
        //         },
        //         "message": null
        //     }
        //
        const orderbook = this.parseOrderBook(response['data'], symbol, undefined, 'bids', 'asks', 'price', 'amount');
        return orderbook;
    }
    async fetchTrades(symbol, since = undefined, limit = undefined, params = {}) {
        /**
         * @method
         * @name ripio#fetchTrades
         * @description get the list of most recent trades for a particular symbol
         * @param {string} symbol unified symbol of the market to fetch trades for
         * @param {int|undefined} since timestamp in ms of the earliest trade to fetch
         * @param {int|undefined} limit the maximum amount of trades to fetch
         * @param {object} params extra parameters specific to the ripio api endpoint
         * @returns {[object]} a list of [trade structures]{@link https://docs.ccxt.com/en/latest/manual.html?#public-trades}
         */
        await this.loadMarkets();
        symbol = this.symbol(symbol);
        const market = this.market(symbol);
        params = this.extend(params, { 'pair': this.marketId(symbol) });
        const response = await this.publicGetTrades(params);
        //
        //     {
        //         "data": {
        //             "pagination": {
        //                 "current_page": 1,
        //                 "page_size": 200,
        //                 "registers_count": 71840,
        //                 "total_pages": 360
        //             },
        //             "trades": [
        //                 {
        //                     "amount": 0.02559772,
        //                     "date": "2023-04-17T13:47:29.483Z",
        //                     "id": "CC3A6AD4-C0F8-4E3D-A864-08111B1B3E1A",
        //                     "maker_order_id": "B0C92B05-8278-4482-AB56-8585A20A4366",
        //                     "maker_side": "sell",
        //                     "maker_type": "limit",
        //                     "pair": "BTC_BRL",
        //                     "price": 146849,
        //                     "taker_order_id": "46D112BB-5180-4F14-B2BF-B63E06D68F44",
        //                     "taker_side": "buy",
        //                     "taker_type": "market",
        //                     "timestamp": 1681739809450,
        //                     "total_value": 3758
        //                 },
        //             ]
        //         },
        //         "message": null
        //     }
        //
        const data = this.safeValue(response, 'data');
        const trades = this.safeValue(data, 'trades');
        return this.parseTrades(trades, market, since, limit);
    }
    async fetchBalance(params = {}) {
        /**
         * @method
         * @name ripio#fetchBalance
         * @description query for balance and get the amount of funds available for trading or funds locked in orders
         * @param {object} params extra parameters specific to the ripio api endpoint
         * @returns {object} a [balance structure]{@link https://docs.ccxt.com/en/latest/manual.html?#balance-structure}
         */
        await this.loadMarkets();
        const response = await this.privateGetUserBalances(params);
        //
        //     {
        //         "data": [
        //             {
        //                 "currency_code": "BTC",
        //                 "available_amount": 0.00047545,
        //                 "locked_amount": 0,
        //                 "last_update": "2023-02-22T15:22:36.647Z"
        //             },
        //         ],
        //         "message": null,
        //         "timestamp": 1681740098156
        //     }
        //
        const result = { 'info': response };
        const data = this.safeValue(response, 'data');
        for (let i = 0; i < data.length; i++) {
            const balance = data[i];
            const currencyId = this.safeString(balance, 'currency_code');
            const code = this.safeCurrencyCode(currencyId);
            const account = this.account();
            account['free'] = this.safeNumber(balance, 'available_amount');
            account['used'] = this.safeNumber(balance, 'locked_amount');
            account['total'] = this.safeNumber(balance, 'available_amount') + this.safeNumber(balance, 'locked_amount');
            result[code] = account;
        }
        return this.safeBalance(result);
    }
    async createOrder(symbol, type, side, amount, price = undefined, params = {}) {
        /**
         * @method
         * @name ripio#createOrder
         * @description create a trade order
         * @param {string} symbol unified symbol of the market to create an order in
         * @param {string} type 'market' or 'limit'
         * @param {string} side 'buy' or 'sell'
         * @param {float} amount how much of currency you want to trade in units of base currency
         * @param {float|undefined} price the price at which the order is to be fullfilled, in units of the quote currency, ignored in market orders
         * @param {object} params extra parameters specific to the ripio api endpoint
         * @returns {object} an [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        await this.loadMarkets();
        symbol = this.symbol(symbol);
        const request = {
            'pair': this.marketId(symbol),
            'type': type,
            'side': side,
            'amount': this.parseNumber(amount),
        };
        if (type === 'limit') {
            request['price'] = this.parseNumber(price);
        }
        const response = await this.privatePostOrders(this.extend(request, params));
        //
        //     {
        //         "message": null,
        //         "data": {
        //             "id": "7155ED34-9EC4-4733-8B32-1E4319CB662F"
        //         }
        //     }
        //
        return response['data']['id'];
    }
    async cancelOrder(id, symbol = undefined, params = {}) {
        /**
         * @method
         * @name ripio#cancelOrder
         * @description cancels an open order
         * @param {string} id order id
         * @param {string|undefined} symbol not used by ripio cancelOrder ()
         * @param {object} params extra parameters specific to the ripio api endpoint
         * @returns {object} An [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        await this.loadMarkets();
        const request = { 'id': id };
        const response = await this.privateDeleteOrders(this.extend(request, params));
        //
        //     {
        //         "message": null,
        //         "data": {
        //             "create_date": "2017-12-08T23:42:54.960Z",
        //             "executed_amount": 0.02347418,
        //             "external_id": "B4A9F7F4-9C79-4921-9330-224C17260BDF",
        //             "id": "7155ED34-9EC4-4733-8B32-1E4319CB662F",
        //             "pair": "BTC_BRL",
        //             "price": 42600,
        //             "remaining_amount": 0.1,
        //             "remaining_value": 0.6,
        //             "requested_amount": 0.02347418,
        //             "side": "buy",
        //             "status": "canceled",
        //             "total_value": 1000,
        //             "type": "limit",
        //             "update_date": "2017-12-13T21:48:48.817Z"
        //         }
        //     }
        //
        const data = this.safeValue(response, 'data');
        if (symbol !== undefined) {
            symbol = this.symbol(symbol);
        }
        else {
            const pair = this.safeValue(data, 'pair');
            symbol = this.symbol(pair);
        }
        const market = this.market(symbol);
        return this.parseOrder(data, market);
    }
    async fetchOrder(id, symbol = undefined, params = {}) {
        /**
         * @method
         * @name ripio#fetchOrder
         * @description fetches information on an order made by the user
         * @param {string|undefined} symbol unified market symbol that the order was made in
         * @param {object} params extra parameters specific to the ripio api endpoint
         * @returns {object} an [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        await this.loadMarkets();
        const request = { 'id': id };
        const response = await this.privateGetOrdersId(this.extend(request, params));
        //
        //     {
        //         "message": null,
        //         "data": {
        //             "average_execution_price": 42600,
        //             "create_date": "2017-12-08T23:42:54.960Z",
        //             "external_id": "C90796F2-2CC3-4797-9AC3-A16BCC6936F0",
        //             "executed_amount": 0.02347418,
        //             "id": "8DE12108-4643-4E9F-8425-0172F1B96876",
        //             "remaining_amount": 0,
        //             "requested_amount": 0.02347418,
        //             "remaining_value": 0,
        //             "pair": "BTC_BRL",
        //             "price": 42600,
        //             "side": "buy",
        //             "status": "executed_completely",
        //             "tax_amount": 0.002,
        //             "total_value": 1000,
        //             "type": "limit",
        //             "update_date": "2017-12-13T21:48:48.817Z",
        //             "transactions": [
        //                 {
        //                     "amount": 0.2,
        //                     "create_date": "2020-02-21 20:24:43.433",
        //                     "fee": 0.12,
        //                     "fee_currency": "BTC",
        //                     "price": 5000,
        //                     "total_value": 1000
        //                 },
        //                 {
        //                     "amount": 0.2,
        //                     "create_date": "2020-02-21 20:49:37.450",
        //                     "fee": 0.12,
        //                     "fee_currency": "BTC",
        //                     "price": 5000,
        //                     "total_value": 1000
        //                 }
        //             ]
        //         }
        //     }
        //
        const data = this.safeValue(response, 'data');
        if (symbol !== undefined) {
            symbol = this.symbol(symbol);
        }
        else {
            const pair = this.safeValue(data, 'pair');
            symbol = this.symbol(pair);
        }
        const market = this.market(symbol);
        return this.parseOrder(data, market);
    }
    async fetchOrders(symbol = undefined, since = undefined, limit = undefined, params = {}) {
        /**
         * @method
         * @name ripio#fetchOrders
         * @description fetches information on multiple orders made by the user
         * @param {string|undefined} symbol unified market symbol that the orders were made in
         * @param {int|undefined} since the earliest time in ms to fetch orders
         * @param {int|undefined} limit the maximum number of order structures to retrieve
         * @param {object} params extra parameters specific to the ripio api endpoint
         * @returns {[object]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        if (symbol === undefined) {
            throw new errors.ArgumentsRequired(this.id + ' fetchOrders() requires a symbol argument');
        }
        symbol = this.symbol(symbol);
        await this.loadMarkets();
        const request = {
            'pair': this.marketId(symbol),
        };
        if (limit !== undefined) {
            request['page_size'] = limit;
        }
        const side = this.safeString(params, 'side', undefined);
        if (side) {
            request['side'] = side;
        }
        const status = this.safeString(params, 'status', undefined);
        if (status) {
            request['status'] = status;
        }
        const response = await this.privateGetOrders(this.extend(request, params));
        //
        //     {
        //         "message": null,
        //         "data": {
        //             "orders": [
        //                 {
        //                     "create_date": "2017-12-08T23:42:54.960Z",
        //                     "executed_amount": 0.02347418,
        //                     "external_id": "B4A9F7F4-9C79-4921-9330-224C17260BDF",
        //                     "id": "857C0A3B-D70F-4256-9051-1C62FADBA8FA",
        //                     "pair": "BTC_BRL",
        //                     "price": 42600,
        //                     "remaining_amount": 0,
        //                     "remaining_value": 0,
        //                     "requested_amount": 0.02347418,
        //                     "side": "buy",
        //                     "status": "executed_completely",
        //                     "total_value": 1000,
        //                     "type": "limit",
        //                     "update_date": "2017-12-13T21:48:48.817Z"
        //                 },
        //             ],
        //             "pagination": {
        //                 "current_page": 1,
        //                 "registers_count": 21,
        //                 "total_pages": 1,
        //                 "page_size": 100
        //             }
        //         }
        //     }
        //
        const data = this.safeValue(response, 'data', {});
        const orders = this.safeValue(data, 'orders', []);
        const market = this.market(symbol);
        return this.parseOrders(orders, market, since, limit);
    }
    async fetchMyTrades(symbol = undefined, since = undefined, limit = undefined, params = {}) {
        /**
         * @method
         * @name ripio#fetchMyTrades
         * @description fetch all trades made by the user
         * @param {string|undefined} symbol unified market symbol
         * @param {int|undefined} since the earliest time in ms to fetch trades for
         * @param {int|undefined} limit the maximum number of trades structures to retrieve
         * @param {object} params extra parameters specific to the ripio api endpoint
         * @returns {[object]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=trade-structure}
         */
        await this.loadMarkets();
        const request = {};
        let market = undefined;
        if (symbol !== undefined) {
            symbol = this.symbol(symbol);
            market = this.market(symbol);
            request['pair'] = this.marketId(symbol);
        }
        if (limit !== undefined) {
            request['page_size'] = limit;
        }
        const response = await this.privateGetUserTrades(this.extend(request, params));
        //
        //     {
        //         "message": null,
        //         "data": {
        //             "trades": [
        //                 {
        //                     "amount": 0.00270754,
        //                     "date": "2019-04-02T11:22:22.403Z",
        //                     "fee": 0.25,
        //                     "fee_currency": "USDC",
        //                     "id": "488F9395-47ED-4924-98AB-C860E1733A03",
        //                     "pair_code": "BTC_USDC",
        //                     "price": 18550,
        //                     "side": "sell",
        //                     "timestamp": 1675708481219,
        //                     "type": "market",
        //                     "total_value": 50.22
        //                 },
        //             ],
        //             "pagination": {
        //                 "current_page": 1,
        //                 "registers_count": 21,
        //                 "total_pages": 1,
        //                 "page_size": 100
        //             }
        //         }
        //     }
        //
        const data = this.safeValue(response, 'data', {});
        const trades = this.safeValue(data, 'trades', []);
        return this.parseTrades(trades, market, since, limit);
    }
    async fetchOpenOrders(symbol = undefined, since = undefined, limit = undefined, params = {}) {
        /**
         * @method
         * @name ripio#fetchOpenOrders
         * @description fetch all unfilled currently open orders
         * @param {string|undefined} symbol unified market symbol
         * @param {int|undefined} since the earliest time in ms to fetch open orders for
         * @param {int|undefined} limit the maximum number of  open orders structures to retrieve
         * @param {object} params extra parameters specific to the ripio api endpoint
         * @returns {[object]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        await this.loadMarkets();
        const request = {};
        let market = undefined;
        if (symbol !== undefined) {
            symbol = this.symbol(symbol);
            market = this.market(symbol);
            request['pair'] = this.marketId(symbol);
        }
        if (limit !== undefined) {
            request['page_size'] = limit;
        }
        const side = this.safeString(params, 'side', undefined);
        if (side !== undefined) {
            request['side'] = side;
        }
        const response = await this.privateGetOrdersOpen(this.extend(request, params));
        //
        //     {
        //         "message": null,
        //         "data": {
        //             "orders": [
        //                 {
        //                     "create_date": "2017-12-08T23:42:54.960Z",
        //                     "executed_amount": 0.02347418,
        //                     "external_id": "B4A9F7F4-9C79-4921-9330-224C17260BDF",
        //                     "id": "857C0A3B-D70F-4256-9051-1C62FADBA8FA",
        //                     "pair": "BTC_BRL",
        //                     "price": 42600,
        //                     "remaining_amount": 0,
        //                     "remaining_value": 0,
        //                     "requested_amount": 0.02347418,
        //                     "side": "buy",
        //                     "status": "executed_completely",
        //                     "total_value": 1000,
        //                     "type": "limit",
        //                     "update_date": "2017-12-13T21:48:48.817Z"
        //                 },
        //             ],
        //             "pagination": {
        //                 "current_page": 1,
        //                 "registers_count": 21,
        //                 "total_pages": 1,
        //                 "page_size": 100
        //             }
        //         }
        //     }
        //
        const data = this.safeValue(response, 'data', {});
        const orders = this.safeValue(data, 'orders', []);
        return this.parseOrders(orders, market, since, limit);
    }
    async fetchClosedOrders(symbol = undefined, since = undefined, limit = undefined, params = {}) {
        /**
         * @method
         * @name ripio#fetchClosedOrders
         * @description fetches information on multiple closed orders made by the user
         * @param {string|undefined} symbol unified market symbol of the orders
         * @param {int|undefined} since timestamp in ms of the earliest order, default is undefined
         * @param {int|undefined} limit the maximum number of closed order structures to retrieve
         * @param {object} params extra parameters specific to the ripio api endpoint
         * @returns {[object]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        if (symbol === undefined) {
            throw new errors.ArgumentsRequired(this.id + ' fetchClosedOrders() requires a symbol argument');
        }
        symbol = this.symbol(symbol);
        const request = {
            'status': ['executed_completely', 'canceled'],
        };
        const orders = await this.fetchOrders(symbol, since, limit, this.extend(request, params));
        //
        //     {
        //         "message": null,
        //         "data": {
        //             "orders": [
        //                 {
        //                     "create_date": "2017-12-08T23:42:54.960Z",
        //                     "executed_amount": 0.02347418,
        //                     "external_id": "B4A9F7F4-9C79-4921-9330-224C17260BDF",
        //                     "id": "857C0A3B-D70F-4256-9051-1C62FADBA8FA",
        //                     "pair": "BTC_BRL",
        //                     "price": 42600,
        //                     "remaining_amount": 0,
        //                     "remaining_value": 0,
        //                     "requested_amount": 0.02347418,
        //                     "side": "buy",
        //                     "status": "executed_completely",
        //                     "total_value": 1000,
        //                     "type": "limit",
        //                     "update_date": "2017-12-13T21:48:48.817Z"
        //                 },
        //             ],
        //             "pagination": {
        //                 "current_page": 1,
        //                 "registers_count": 21,
        //                 "total_pages": 1,
        //                 "page_size": 100
        //             }
        //         }
        //     }
        //
        return orders;
    }
    async fetchCanceledOrders(symbol = undefined, since = undefined, limit = undefined, params = {}) {
        /**
         * @method
         * @name ripio#fetchCanceledOrders
         * @description fetches information on multiple canceled orders made by the user
         * @param {string} symbol unified market symbol of the orders
         * @param {int|undefined} since timestamp in ms of the earliest order, default is undefined
         * @param {int|undefined} limit the maximum number of canceled order structures to retrieve
         * @param {object} params extra parameters specific to the ripio api endpoint
         * @returns {object} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        if (symbol === undefined) {
            throw new errors.ArgumentsRequired(this.id + ' fetchCanceledOrders() requires a symbol argument');
        }
        symbol = this.symbol(symbol);
        const request = {
            'status': ['canceled'],
        };
        const orders = await this.fetchOrders(symbol, since, limit, this.extend(request, params));
        //
        //     {
        //         "message": null,
        //         "data": {
        //             "orders": [
        //                 {
        //                     "create_date": "2017-12-08T23:42:54.960Z",
        //                     "executed_amount": 0,
        //                     "external_id": "B4A9F7F4-9C79-4921-9330-224C17260BDF",
        //                     "id": "857C0A3B-D70F-4256-9051-1C62FADBA8FA",
        //                     "pair": "BTC_BRL",
        //                     "price": 42600,
        //                     "remaining_amount": 0.02347418,
        //                     "remaining_value": 0,
        //                     "requested_amount": 0.02347418,
        //                     "side": "buy",
        //                     "status": "canceled",
        //                     "total_value": 1000,
        //                     "type": "limit",
        //                     "update_date": "2017-12-13T21:48:48.817Z"
        //                 },
        //             ],
        //             "pagination": {
        //                 "current_page": 1,
        //                 "registers_count": 21,
        //                 "total_pages": 1,
        //                 "page_size": 100
        //             }
        //         }
        //     }
        //
        return orders;
    }
    async withdraw(code, amount, address, tag = undefined, params = {}) {
        /**
         * @method
         * @name ripio#withdraw
         * @description make a withdrawal
         * @param {string} code unified currency code
         * @param {float} amount the amount to withdraw
         * @param {string} address the address to withdraw to
         * @param {string|undefined} tag
         * @param {object} params extra parameters specific to the ripio api endpoint
         * @returns {object} a [transaction structure]{@link https://docs.ccxt.com/#/?id=transaction-structure}
         */
        [tag, params] = this.handleWithdrawTagAndParams(tag, params);
        this.checkAddress(address);
        await this.loadMarkets();
        const currency = this.currency(code);
        const feeType = this.safeString(params, 'fee_type', 'regular');
        const request = {
            'currency_code': currency['code'],
            'fee_type': feeType,
            'amount': amount,
            'destination': address,
        };
        if (tag !== undefined) {
            request['tag'] = tag;
        }
        const memo = this.safeString(params, 'memo');
        if (memo !== undefined) {
            request['memo'] = memo;
        }
        // TODO(pgold): add network parameter.
        const response = await this.privatePostWithdrawals(this.extend(request, params));
        const data = this.safeValue(response, 'data');
        //
        //     {
        //         "data": {
        //             "amount": "1000",
        //             "create_date": "2023-07-13T15:54:27.710Z",
        //             "currency_code": "CREAL",
        //             "destination_address": " 0xEeA875a27ad44F6f4608097cFcb8c2417A235A41",
        //             "id": "idwxr8yoV",
        //             "link": null,
        //             "miner_fee": "0.1",
        //             "miner_fee_type": "regular",
        //             "network": "celo",
        //             "origin_address": "0x9e240434E845D7Bb2CE7218eD487687a6bC2E111",
        //             "status": "pending",
        //             "tax_amount": "0",
        //             "tax_index": "0",
        //             "tax_index_calculated": "0",
        //             "transaction_id": null,
        //             "update_date": "2023-07-11T12:22:34.590Z"
        //         },
        //         "message": null
        //     }
        //
        return this.parseTransaction(data, currency);
    }
    async fetchWebSocketTicket() {
        /**
         * @method
         * @name ripio#fetchWebSocketTicket
         * @description fetches a ticket so the user can connect to ripio's websocket private topics
         * @returns {string} a websocket ticket
         */
        await this.loadMarkets();
        const response = await this.privatePostTicket();
        //
        //     {
        //         "message": null,
        //         "data": {
        //             "ticket": "D90A9A10-06AF-44AF-8592-BAF866DD1503"
        //         }
        //     }
        //
        const data = this.safeValue(response, 'data');
        const ticket = this.safeString(data, 'ticket');
        return ticket;
    }
    parseTicker(ticker, symbol = undefined) {
        //
        // fetchTicker (public), fetchTickers (public)
        //
        //      {
        //          "ask": 250000.15,
        //          "base_code": "BTC",
        //          "base_id": "9A5E2EF4-9547-418A-8EC6-C6EADBB8B32F",
        //          "bid": 240000.15,
        //          "date": "2017-10-20T00:00:00Z",
        //          "high": 250000.15,
        //          "is_frozen": false,
        //          "last": 245000.15,
        //          "low": 200000.15,
        //          "pair": "BTC_BRL",
        //          "price_change_percent_24h": "-12",
        //          "quote_code": "BRL",
        //          "quote_id": "48898138-8623-4555-9468-B1A1505A9352",
        //          "quote_volume": 150.1,
        //          "trades_quantity": 123,
        //          "volume": 123.12345678
        //      }
        //
        const timestamp = this.parseDate(this.safeString(ticker, 'date'));
        const last = this.safeNumber(ticker, 'last');
        const pair = this.safeString(ticker, 'pair');
        if (symbol === undefined && pair !== undefined) {
            symbol = this.symbol(pair);
        }
        return this.safeTicker({
            'symbol': symbol,
            'timestamp': timestamp,
            'datetime': this.iso8601(timestamp),
            'high': this.safeString(ticker, 'high'),
            'low': this.safeString(ticker, 'low'),
            'bid': this.safeString(ticker, 'bid'),
            'bidVolume': undefined,
            'ask': this.safeString(ticker, 'ask'),
            'askVolume': undefined,
            'vwap': undefined,
            'open': undefined,
            'close': last,
            'last': last,
            'previousClose': undefined,
            'change': undefined,
            'percentage': this.safeString(ticker, 'price_change_percent_24h'),
            'average': undefined,
            'baseVolume': this.safeString(ticker, 'volume'),
            'quoteVolume': this.safeString(ticker, 'quote_volume'),
            'info': ticker,
        });
    }
    parseTrade(trade, market = undefined) {
        //
        // fetchTrades (public)
        //
        //      {
        //          "amount": 0.2404764,
        //          "date": "2019-01-03T02:27:33.947Z",
        //          "id": "2B222F22-5235-45FA-97FC-E9DBFA2575EE",
        //          "maker_order_id": "F49F5BD8-3F5B-4364-BCEE-F36F62DB966A",
        //          "maker_side": "buy",
        //          "maker_type": "limit",
        //          "price": 15160,
        //          "taker_order_id": "FEAB5CEC-7F9E-4F95-B67D-9E8D5C739BE3",
        //          "taker_side": "sell",
        //          "taker_type": "market",
        //          "timestamp": 1675708481219,
        //          "total_value": 3638.4
        //      }
        //
        // fetchMyTrades (private)
        //
        //      {
        //          "amount": 0.00270754,
        //          "date": "2019-04-02T11:22:22.403Z",
        //          "fee": 0.25,
        //          "fee_currency": "USDC",
        //          "id": "488F9395-47ED-4924-98AB-C860E1733A03",
        //          "pair_code": "BTC_USDC",
        //          "price": 18550,
        //          "side": "sell",
        //          "timestamp": 1675708481219,
        //          "type": "market",
        //          "total_value": 50.22
        //      }
        //
        const timestamp = this.parseDate(this.safeString(trade, 'date'));
        const id = this.safeString(trade, 'id');
        let side = this.safeStringLower(trade, 'side');
        if (side === undefined) {
            side = this.safeString(trade, 'taker_side');
        }
        let takerOrMaker = this.safeString(trade, 'taker_or_maker');
        if (takerOrMaker === undefined) {
            takerOrMaker = 'taker';
        }
        const price = this.safeString(trade, 'price');
        const amount = this.safeString(trade, 'amount');
        const fee = undefined;
        const pairCode = this.safeString(trade, 'pair_code');
        const pair = this.safeString(trade, 'pair');
        let symbol = this.safeString(market, 'symbol');
        if (symbol !== undefined) {
            symbol = this.symbol(symbol);
        }
        else if (pair !== undefined) {
            symbol = this.symbol(pair);
        }
        else if (pairCode !== undefined) {
            symbol = this.symbol(pairCode);
        }
        if (market === undefined && symbol !== undefined) {
            market = this.market(symbol);
        }
        const order = this.safeString(trade, 'taker_order_id');
        let type = this.safeString(trade, 'type');
        if (type === undefined) {
            type = this.safeString(trade, 'taker_type');
        }
        return this.safeTrade({
            'id': id,
            'timestamp': timestamp,
            'datetime': this.iso8601(timestamp),
            'type': type,
            'side': side,
            'price': price,
            'amount': amount,
            'cost': undefined,
            'takerOrMaker': takerOrMaker,
            'fee': fee,
            'info': trade,
            'symbol': symbol,
            'order': order,
        }, market);
    }
    parseOrderStatus(status) {
        const statuses = {
            'executed_completely': 'closed',
            'executed_partially': 'open',
            'waiting': 'open',
            'canceled': 'canceled',
            'pending_creation': 'pending creation',
        };
        return this.safeString(statuses, status, status);
    }
    parseOrder(order, market = undefined) {
        //
        // fetchOrder (private)
        //
        //      {
        //          "average_execution_price": 42600,
        //          "create_date": "2017-12-08T23:42:54.960Z",
        //          "external_id": "C90796F2-2CC3-4797-9AC3-A16BCC6936F0",
        //          "executed_amount": 0.02347418,
        //          "id": "8DE12108-4643-4E9F-8425-0172F1B96876",
        //          "remaining_amount": 0,
        //          "requested_amount": 0.02347418,
        //          "remaining_value": 0,
        //          "pair": "BTC_BRL",
        //          "price": 42600,
        //          "side": "buy",
        //          "status": "executed_completely",
        //          "tax_amount": 0.002,
        //          "total_value": 1000,
        //          "type": "limit",
        //          "update_date": "2017-12-13T21:48:48.817Z",
        //          "transactions": [
        //              {
        //                  "amount": 0.2,
        //                  "create_date": "2020-02-21 20:24:43.433",
        //                  "fee": 0.12,
        //                  "fee_currency": "BTC",
        //                  "price": 5000,
        //                  "total_value": 1000
        //              },
        //              {
        //                  "amount": 0.2,
        //                  "create_date": "2020-02-21 20:49:37.450",
        //                  "fee": 0.12,
        //                  "fee_currency": "BTC",
        //                  "price": 5000,
        //                  "total_value": 1000
        //              }
        //          ]
        //      }
        //
        // cancelOrder (private), fetchOrders (private), fetchOpenOrders (private), fetchClosedOrders (private), fetchCanceledOrders (private)
        //
        //      {
        //          "create_date": "2017-12-08T23:42:54.960Z",
        //          "executed_amount": 0.02347418,
        //          "external_id": "B4A9F7F4-9C79-4921-9330-224C17260BDF",
        //          "id": "7155ED34-9EC4-4733-8B32-1E4319CB662F",
        //          "pair": "BTC_BRL",
        //          "price": 42600,
        //          "remaining_amount": 0.1,
        //          "remaining_value": 0.6,
        //          "requested_amount": 0.02347418,
        //          "side": "buy",
        //          "status": "canceled",
        //          "total_value": 1000,
        //          "type": "limit",
        //          "update_date": "2017-12-13T21:48:48.817Z"
        //      }
        //
        const id = this.safeString(order, 'id');
        const clientOrderId = this.safeString(order, 'external_id');
        const amount = this.safeNumber(order, 'requested_amount');
        const type = this.safeStringLower(order, 'type');
        const price = this.safeNumber(order, 'price');
        const side = this.safeStringLower(order, 'side');
        const status = this.parseOrderStatus(this.safeString(order, 'status'));
        const timestamp = this.parseDate(this.safeString(order, 'create_date'));
        const average = undefined;
        const filled = this.safeNumber(order, 'executed_amount');
        const cost = this.parseNumber(Precise["default"].stringMul(this.safeString(order, 'price'), this.safeString(order, 'executed_amount')));
        const trades = undefined;
        let lastTradeTimestamp = undefined;
        if (filled > 0) {
            lastTradeTimestamp = this.parseDate(this.safeString(order, 'update_date'));
        }
        const remaining = this.safeNumber(order, 'remaining_amount');
        let symbol = undefined;
        const pair = this.safeString(order, 'pair');
        if (pair !== undefined) {
            symbol = this.symbol(pair);
        }
        if (market === undefined && symbol !== undefined) {
            market = this.market(symbol);
        }
        return this.safeOrder({
            'id': id,
            'clientOrderId': clientOrderId,
            'info': order,
            'timestamp': timestamp,
            'datetime': this.iso8601(timestamp),
            'lastTradeTimestamp': lastTradeTimestamp,
            'symbol': symbol,
            'type': type,
            'timeInForce': undefined,
            'postOnly': undefined,
            'side': side,
            'price': price,
            'stopPrice': undefined,
            'triggerPrice': undefined,
            'amount': amount,
            'cost': cost,
            'average': average,
            'filled': filled,
            'remaining': remaining,
            'status': status,
            'fee': undefined,
            'trades': trades,
        }, market);
    }
    parseTransactionStatus(status) {
        const statuses = {
            'pending': 'pending',
            'confirmed': 'ok',
            'canceled': 'failed',
        };
        return this.safeString(statuses, status, status);
    }
    parseTransaction(transaction, currency = undefined) {
        // TODO(pgold): fetchWithdrawals and fetchDeposits do not match.
        //
        // withdraw
        //
        //     {
        //         "amount": "1000",
        //         "create_date": "2023-07-13T15:54:27.710Z",
        //         "currency_code": "CREAL",
        //         "destination_address": " 0xEeA875a27ad44F6f4608097cFcb8c2417A235A41",
        //         "id": "idwxr8yoV",
        //         "link": null,
        //         "miner_fee": "0.1",
        //         "miner_fee_type": "regular",
        //         "network": "celo",
        //         "origin_address": "0x9e240434E845D7Bb2CE7218eD487687a6bC2E111",
        //         "status": "pending",
        //         "tax_amount": "0",
        //         "tax_index": "0",
        //         "tax_index_calculated": "0",
        //         "transaction_id": null,
        //         "update_date": "2023-07-11T12:22:34.590Z"
        //     },
        //
        // fetchWithdrawals
        //
        //     {
        //         "amount": 5000,
        //         "code": "eY_ZNjWJ8",
        //         "create_date": "2022-08-31T18:19:59.312Z",
        //         "currency_code": "CREAL",
        //         "destination_address": "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        //         "is_internal": false,
        //         "link": null,
        //         "miner_fee": 0.1,
        //         "miner_fee_type": "regular",
        //         "network": "celo",
        //         "origin_address": "0x9e240434E845D7Bb2CE7218eD487687a6bC2E111",
        //         "status": "confirmed",
        //         "tax_amount": 0,
        //         "tax_index": 0,
        //         "tax_index_calculated": 0,
        //         "transaction_id": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        //         "update_date": "2022-08-31T19:01:01.420Z"
        //     }
        //
        // fetchDeposits
        //
        //     {
        //         "amount": 458.81,
        //         "code": "Zet_q-K42",
        //         "confirmation_date": "2022-08-02T11:25:32.457Z",
        //         "create_date": "2022-08-02T11:24:28.332Z",
        //         "currency_code": "CREAL",
        //         "hash": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        //         "is_internal": false,
        //         "network": "celo",
        //         "status": "confirmed"
        //     }
        //
        const id = this.safeString(transaction, 'id');
        const amount = this.safeNumber(transaction, 'amount');
        const addressTo = this.safeString(transaction, 'origin_address');
        const addressFrom = this.safeString(transaction, 'destination_address');
        const txid = this.safeString2(transaction, 'transaction_id', 'hash');
        const create_datetime = this.safeString(transaction, 'create_date');
        const update_datetime = this.safeString2(transaction, 'update_date', 'confirmation_date');
        const currencyId = this.safeString(transaction, 'currency_code');
        const code = this.safeCurrencyCode(currencyId, currency);
        const status = this.parseTransactionStatus(this.safeString(transaction, 'status'));
        const network = this.safeString(transaction, 'network');
        const tag = this.safeString(transaction, 'tag');
        const feeCost = this.safeNumber(transaction, 'miner_fee');
        let fee = undefined;
        if (feeCost !== undefined) {
            fee = { 'currency': code, 'cost': feeCost };
        }
        return {
            'info': transaction,
            'id': id,
            'currency': code,
            'amount': amount,
            'network': network,
            'address': undefined,
            'addressTo': addressTo,
            'addressFrom': addressFrom,
            'tag': tag,
            'tagTo': undefined,
            'tagFrom': undefined,
            'status': status,
            'type': undefined,
            'updated': this.parse8601(update_datetime),
            'txid': txid,
            'timestamp': this.parse8601(create_datetime),
            'datetime': create_datetime,
            'fee': fee,
        };
    }
    sign(path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        const request = '/' + this.implodeParams(path, params);
        let url = this.urls['api'][api] + request;
        const query = this.omit(params, this.extractParams(path));
        if (api === 'public') {
            if (Object.keys(query).length) {
                url += '?' + this.urlencode(query);
            }
        }
        else if (api === 'private') {
            this.checkRequiredCredentials();
            if (method === 'POST' || method === 'DELETE') {
                body = this.json(query);
            }
            else {
                if (Object.keys(query).length) {
                    url += '?' + this.urlencode(query);
                }
            }
            headers = {
                'Content-Type': 'application/json',
                'Authorization': this.apiKey,
            };
        }
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }
    handleErrors(code, reason, url, method, headers, body, response, requestHeaders, requestBody) {
        if (response === undefined) {
            return;
        }
        if ((code >= 400) && (code <= 503)) {
            const feedback = this.id + ' ' + body;
            const message = this.safeString(response, 'message');
            this.throwBroadlyMatchedException(this.exceptions['broad'], message, feedback);
            const status = code.toString();
            this.throwExactlyMatchedException(this.exceptions['exact'], status, feedback);
        }
    }
}

module.exports = ripio;
