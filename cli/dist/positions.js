import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import bondNftAbi from '../abi/bondNft.json' with { type: 'json' };
import { fetchBondsCatalog } from './apis.js';
import { BASE_BILL_NFT, BASE_RPC, CHAIN_ID_BASE } from './constants.js';
const bondReadAbi = [
    {
        inputs: [{ name: 'billId', type: 'uint256' }],
        name: 'claimablePayout',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
];
function earnSymbolByBondContract(catalog) {
    const map = new Map();
    for (const bond of catalog) {
        if (bond.chainId !== CHAIN_ID_BASE)
            continue;
        const addr = bond.contractAddress?.[CHAIN_ID_BASE];
        if (!addr || !bond.earnToken?.symbol)
            continue;
        map.set(addr.toLowerCase(), bond.earnToken.symbol);
    }
    return map;
}
/**
 * Discover positions like SDK Your Bonds (EVM): enumerate Bill NFTs on Base, then read each bond contract.
 * Does not use realtime-api /bonds (active list only) — inactive bonds still appear if the user holds the NFT.
 */
export async function fetchPositions(owner) {
    const client = createPublicClient({ chain: base, transport: http(BASE_RPC) });
    const ownerAddr = owner;
    const owned = (await client.readContract({
        address: BASE_BILL_NFT,
        abi: bondNftAbi,
        functionName: 'allTokensDataOfOwner',
        args: [ownerAddr],
    }));
    if (!owned.length)
        return [];
    const catalog = await fetchBondsCatalog();
    const earnByBond = earnSymbolByBondContract(catalog);
    const rows = await Promise.all(owned.map(async ({ tokenId, billAddress }) => {
        const claimable = await client.readContract({
            address: billAddress,
            abi: bondReadAbi,
            functionName: 'claimablePayout',
            args: [tokenId],
        });
        return {
            billNft: BASE_BILL_NFT,
            bondContract: billAddress,
            earnToken: earnByBond.get(billAddress.toLowerCase()),
            billId: tokenId.toString(),
            claimablePayout: claimable.toString(),
        };
    }));
    return rows;
}
