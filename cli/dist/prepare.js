import { createPublicClient, encodeFunctionData, http } from 'viem';
import { base } from 'viem/chains';
import depositAbi from '../abi/deposit.json' with { type: 'json' };
import depositSigAbi from '../abi/depositSig.json' with { type: 'json' };
import erc20Abi from '../abi/erc20.json' with { type: 'json' };
import { fetchBaseBonds, fetchSoulZapQuote, fetchTierProofSignature } from './apis.js';
import { BASE_RPC, CHAIN_ID_BASE, SOUL_ZAP_TOKEN_MANAGER_BASE, } from './constants.js';
import { computeMaxPrice, convertToBigish, getBondContract, normalizeAddress, resolveTrueBondPrice, } from './utils.js';
const bondReadAbi = [
    {
        inputs: [{ name: 'owner', type: 'address' }],
        name: 'getBillIds',
        outputs: [{ name: '', type: 'uint256[]' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'billId', type: 'uint256' }],
        name: 'redeem',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'billIds', type: 'uint256[]' }],
        name: 'batchRedeem',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];
const nftAbi = [
    {
        inputs: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
        ],
        name: 'safeTransferFrom',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];
function tx(step, to, data, value = '0x0') {
    return {
        step,
        to: normalizeAddress(to),
        data,
        value: value,
        chainId: CHAIN_ID_BASE,
    };
}
export async function prepareBuy(opts) {
    const bonds = await fetchBaseBonds(opts.bond);
    const bond = bonds.find((b) => getBondContract(b, CHAIN_ID_BASE).toLowerCase() === opts.bond.toLowerCase());
    if (!bond)
        throw new Error(`Bond ${opts.bond} not found on Base`);
    if (bond.soldOut)
        throw new Error('Bond is sold out');
    const bondContract = getBondContract(bond, CHAIN_ID_BASE);
    const principal = bond.lpToken?.address?.[CHAIN_ID_BASE];
    const decimals = bond.lpToken?.decimals?.[CHAIN_ID_BASE] ?? 18;
    if (!principal)
        throw new Error('Principal token address missing from bond payload');
    const amount = convertToBigish(opts.amount, decimals);
    const truePrice = resolveTrueBondPrice(bond);
    const maxPrice = computeMaxPrice(truePrice);
    const isV4 = bond.billVersion === 'V4';
    const useSig = Boolean(opts.withTiers && isV4);
    let tierProof;
    if (useSig) {
        const sig = await fetchTierProofSignature(opts.from, bondContract);
        tierProof = sig.startsWith('0x') ? sig : `0x${sig}`;
    }
    const depositData = encodeFunctionData({
        abi: useSig ? depositSigAbi : depositAbi,
        functionName: 'deposit',
        args: useSig
            ? [BigInt(amount), BigInt(maxPrice), opts.from, tierProof]
            : [BigInt(amount), BigInt(maxPrice), opts.from],
    });
    const transactions = [];
    if (!opts.skipApprove) {
        const client = createPublicClient({ chain: base, transport: http(BASE_RPC) });
        const allowance = await client.readContract({
            address: principal,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [opts.from, bondContract],
        });
        if (BigInt(allowance) < BigInt(amount)) {
            const approveData = encodeFunctionData({
                abi: erc20Abi,
                functionName: 'approve',
                args: [bondContract, BigInt(amount)],
            });
            transactions.push(tx('approve', principal, approveData));
        }
    }
    transactions.push(tx('deposit', bondContract, depositData));
    return { transactions };
}
export function prepareRedeem(bond, billId) {
    const data = encodeFunctionData({
        abi: bondReadAbi,
        functionName: 'redeem',
        args: [BigInt(billId)],
    });
    return { transactions: [tx('redeem', bond, data)] };
}
export function prepareBatchRedeem(bond, billIds) {
    const data = encodeFunctionData({
        abi: bondReadAbi,
        functionName: 'batchRedeem',
        args: [billIds.map((id) => BigInt(id))],
    });
    return { transactions: [tx('batch-redeem', bond, data)] };
}
export function prepareTransfer(nft, from, to, tokenId) {
    const data = encodeFunctionData({
        abi: nftAbi,
        functionName: 'safeTransferFrom',
        args: [from, to, BigInt(tokenId)],
    });
    return { transactions: [tx('transfer', nft, data)] };
}
export async function prepareZapBuy(opts) {
    const bonds = await fetchBaseBonds(opts.bond);
    const bond = bonds[0];
    if (!bond)
        throw new Error(`Bond ${opts.bond} not found`);
    const bondContract = getBondContract(bond, CHAIN_ID_BASE);
    const principal = bond.lpToken?.address?.[CHAIN_ID_BASE];
    const decimals = bond.lpToken?.decimals?.[CHAIN_ID_BASE] ?? 18;
    if (!principal)
        throw new Error('Principal token missing');
    const fromAmount = convertToBigish(opts.amount, opts.fromToken === '0x0000000000000000000000000000000000000000' ? 18 : decimals);
    let tierProofSignature;
    if (opts.withTiers && bond.billVersion === 'V4') {
        tierProofSignature = await fetchTierProofSignature(opts.from, bondContract);
    }
    const isPrincipal = opts.fromToken.toLowerCase() === principal.toLowerCase() ||
        opts.fromToken === '0x0000000000000000000000000000000000000000';
    const zapBody = {
        chain: 'bas',
        recipient: opts.from,
        user: opts.from,
        lpData: isPrincipal
            ? {
                lpType: 'none',
                fromToken: opts.fromToken,
                fromAmount: fromAmount,
            }
            : {
                lpType: 'univ2',
                fromToken: opts.fromToken,
                fromAmount: fromAmount,
                slippage: opts.slippage ?? 0.5,
                lpAddress: principal,
            },
        protocolData: {
            protocol: 'ApeBond',
            bond: bondContract,
            depositer: opts.from,
            tierProofSignature,
            enableTierOptimizer: Boolean(opts.withTiers),
            tierBoostRate: bond.tierBoostRate,
        },
    };
    const zap = await fetchSoulZapQuote(zapBody);
    if (!zap.txData?.to || !zap.txData?.data) {
        throw new Error('Soul Zap did not return txData (check amount, token, and bond liquidity)');
    }
    const transactions = [];
    if (!isPrincipal) {
        const client = createPublicClient({ chain: base, transport: http(BASE_RPC) });
        const spender = SOUL_ZAP_TOKEN_MANAGER_BASE;
        const allowance = await client.readContract({
            address: opts.fromToken,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [opts.from, spender],
        });
        if (BigInt(allowance) < BigInt(fromAmount)) {
            const approveData = encodeFunctionData({
                abi: erc20Abi,
                functionName: 'approve',
                args: [spender, BigInt(fromAmount)],
            });
            transactions.push(tx('approve-zap', opts.fromToken, approveData));
        }
    }
    transactions.push(tx('zap', zap.txData.to, zap.txData.data));
    return { transactions };
}
