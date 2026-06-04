export interface PositionRow {
    bondContract: string;
    earnToken?: string;
    billId: string;
    claimablePayout: string;
}
export declare function fetchPositions(owner: string): Promise<PositionRow[]>;
