export declare function adjustDecimals(numStr: string): string;
export declare function convertToBigish(numberString: string, decimals: number): string;
export declare function resolveTrueBondPrice(bond: {
    trueBillPrice?: string;
    trueBondPrices?: Array<{
        points: string;
        trueBondPrice: string;
    }>;
}): string;
export declare function computeMaxPrice(trueBondPrice: string): string;
export declare function getBondContract(bond: {
    contractAddress?: Record<number, string>;
    billAddress?: string;
}, chainId: number): string;
export declare function normalizeAddress(addr: string): `0x${string}`;
/** api.ape.bond redirects (302) to the bond NFT image (IPFS/CDN). */
export declare function billImageRedirectUrl(billId: string | number): string;
