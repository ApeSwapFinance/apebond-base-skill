export interface PositionRow {
    billNft: string;
    bondContract: string;
    earnToken?: string;
    billId: string;
    imageUrl: string;
    claimablePayout: string;
}
/**
 * Discover positions like SDK Your Bonds (EVM): enumerate Bill NFTs on Base, then read each bond contract.
 * Does not use realtime-api /bonds (active list only) — inactive bonds still appear if the user holds the NFT.
 */
export declare function fetchPositions(owner: string): Promise<PositionRow[]>;
