import type { PrepareResponse } from './types.js';
export declare function prepareBuy(opts: {
    bond: string;
    amount: string;
    from: string;
    withTiers?: boolean;
    skipApprove?: boolean;
}): Promise<PrepareResponse>;
export declare function prepareRedeem(bond: string, billId: string): PrepareResponse;
export declare function prepareBatchRedeem(bond: string, billIds: string[]): PrepareResponse;
export declare function prepareTransfer(nft: string, from: string, to: string, tokenId: string): PrepareResponse;
export declare function prepareZapBuy(opts: {
    bond: string;
    amount: string;
    from: string;
    fromToken: string;
    withTiers?: boolean;
    slippage?: number;
}): Promise<PrepareResponse>;
