import type { RealtimeBond } from './types.js';
export declare function fetchBaseBonds(bondAddress?: string): Promise<RealtimeBond[]>;
export declare function fetchTierProofSignature(user: string, bond: string): Promise<string>;
export declare function trackWidgetTransaction(opts: {
    transactionHash: string;
    billContract: string;
    reason?: string;
}): Promise<void>;
export declare function fetchSoulZapQuote(body: Record<string, unknown>): Promise<{
    txData?: {
        to?: string;
        data?: string;
    };
    protocolQuote?: unknown;
}>;
