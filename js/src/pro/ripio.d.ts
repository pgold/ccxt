import { Int } from '../base/types.js';
import Client from '../base/ws/Client.js';
import ripioRest from '../ripio.js';
export default class ripio extends ripioRest {
    describe(): any;
    watchTrades(symbol?: string, since?: Int, limit?: Int, params?: {}): Promise<any>;
    watchTicker(symbol?: string, params?: {}): Promise<any>;
    watchOrderBook(symbol?: string, limit?: Int, params?: {}): Promise<any>;
    watchBalance(params?: {}): Promise<any>;
    watchMyTrades(symbol?: string, since?: Int, limit?: Int, params?: {}): Promise<any>;
    watchOrders(symbol?: string, since?: Int, limit?: Int, params?: {}): Promise<any>;
    handleTrade(client: Client, message: any, subscription: any): any;
    handleTicker(client: Client, message: any, subscription: any): any;
    handleOrderBook(client: Client, message: any, subscription: any): any;
    handleBalance(client: Client, message: any, subscription: any): any;
    handleDelta(bookside: any, delta: any): void;
    handleDeltas(bookside: any, deltas: any): void;
    handleMessage(client: Client, message: any): any;
}
