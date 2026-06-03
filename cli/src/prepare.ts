import { createPublicClient, encodeFunctionData, http } from 'viem'
import { base } from 'viem/chains'
import depositAbi from '../abi/deposit.json' with { type: 'json' }
import depositSigAbi from '../abi/depositSig.json' with { type: 'json' }
import erc20Abi from '../abi/erc20.json' with { type: 'json' }
import { fetchBaseBonds, fetchSoulZapQuote, fetchTierProofSignature } from './apis.js'
import {
  BASE_RPC,
  CHAIN_ID_BASE,
  SOUL_ZAP_TOKEN_MANAGER_BASE,
} from './constants.js'
import type { PrepareResponse, PreparedTransaction } from './types.js'
import {
  computeMaxPrice,
  convertToBigish,
  getBondContract,
  normalizeAddress,
  resolveTrueBondPrice,
} from './utils.js'

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
] as const

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
] as const

function tx(step: string, to: string, data: `0x${string}`, value = '0x0'): PreparedTransaction {
  return {
    step,
    to: normalizeAddress(to),
    data,
    value: value as `0x${string}`,
    chainId: CHAIN_ID_BASE,
  }
}

export async function prepareBuy(opts: {
  bond: string
  amount: string
  from: string
  withTiers?: boolean
  skipApprove?: boolean
}): Promise<PrepareResponse> {
  const bonds = await fetchBaseBonds(opts.bond)
  const bond = bonds.find(
    (b) => getBondContract(b, CHAIN_ID_BASE).toLowerCase() === opts.bond.toLowerCase(),
  )
  if (!bond) throw new Error(`Bond ${opts.bond} not found on Base`)
  if (bond.soldOut) throw new Error('Bond is sold out')

  const bondContract = getBondContract(bond, CHAIN_ID_BASE)
  const principal = bond.lpToken?.address?.[CHAIN_ID_BASE]
  const decimals = bond.lpToken?.decimals?.[CHAIN_ID_BASE] ?? 18
  if (!principal) throw new Error('Principal token address missing from bond payload')

  const amount = convertToBigish(opts.amount, decimals)
  const truePrice = resolveTrueBondPrice(bond)
  const maxPrice = computeMaxPrice(truePrice)

  const isV4 = bond.billVersion === 'V4'
  const useSig = Boolean(opts.withTiers && isV4)

  let tierProof: `0x${string}` | undefined
  if (useSig) {
    const sig = await fetchTierProofSignature(opts.from, bondContract)
    tierProof = sig.startsWith('0x') ? (sig as `0x${string}`) : (`0x${sig}` as `0x${string}`)
  }

  const depositData = encodeFunctionData({
    abi: useSig ? (depositSigAbi as typeof depositSigAbi) : (depositAbi as typeof depositAbi),
    functionName: 'deposit',
    args: useSig
      ? [BigInt(amount), BigInt(maxPrice), opts.from as `0x${string}`, tierProof!]
      : [BigInt(amount), BigInt(maxPrice), opts.from as `0x${string}`],
  })

  const transactions: PreparedTransaction[] = []

  if (!opts.skipApprove) {
    const client = createPublicClient({ chain: base, transport: http(BASE_RPC) })
    const allowance = await client.readContract({
      address: principal as `0x${string}`,
      abi: erc20Abi as typeof erc20Abi,
      functionName: 'allowance',
      args: [opts.from as `0x${string}`, bondContract as `0x${string}`],
    })
    if (BigInt(allowance as bigint) < BigInt(amount)) {
      const approveData = encodeFunctionData({
        abi: erc20Abi as typeof erc20Abi,
        functionName: 'approve',
        args: [bondContract as `0x${string}`, BigInt(amount)],
      })
      transactions.push(tx('approve', principal, approveData))
    }
  }

  transactions.push(tx('deposit', bondContract, depositData))
  return { transactions }
}

export function prepareRedeem(bond: string, billId: string): PrepareResponse {
  const data = encodeFunctionData({
    abi: bondReadAbi,
    functionName: 'redeem',
    args: [BigInt(billId)],
  })
  return { transactions: [tx('redeem', bond, data)] }
}

export function prepareBatchRedeem(bond: string, billIds: string[]): PrepareResponse {
  const data = encodeFunctionData({
    abi: bondReadAbi,
    functionName: 'batchRedeem',
    args: [billIds.map((id) => BigInt(id))],
  })
  return { transactions: [tx('batch-redeem', bond, data)] }
}

export function prepareTransfer(nft: string, from: string, to: string, tokenId: string): PrepareResponse {
  const data = encodeFunctionData({
    abi: nftAbi,
    functionName: 'safeTransferFrom',
    args: [from as `0x${string}`, to as `0x${string}`, BigInt(tokenId)],
  })
  return { transactions: [tx('transfer', nft, data)] }
}

export async function prepareZapBuy(opts: {
  bond: string
  amount: string
  from: string
  fromToken: string
  withTiers?: boolean
  slippage?: number
}): Promise<PrepareResponse> {
  const bonds = await fetchBaseBonds(opts.bond)
  const bond = bonds[0]
  if (!bond) throw new Error(`Bond ${opts.bond} not found`)

  const bondContract = getBondContract(bond, CHAIN_ID_BASE)
  const principal = bond.lpToken?.address?.[CHAIN_ID_BASE]
  const decimals = bond.lpToken?.decimals?.[CHAIN_ID_BASE] ?? 18
  if (!principal) throw new Error('Principal token missing')

  const fromAmount = convertToBigish(opts.amount, opts.fromToken === '0x0000000000000000000000000000000000000000' ? 18 : decimals)

  let tierProofSignature: string | undefined
  if (opts.withTiers && bond.billVersion === 'V4') {
    tierProofSignature = await fetchTierProofSignature(opts.from, bondContract)
  }

  const isPrincipal =
    opts.fromToken.toLowerCase() === principal.toLowerCase() ||
    opts.fromToken === '0x0000000000000000000000000000000000000000'

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
  }

  const zap = await fetchSoulZapQuote(zapBody)
  if (!zap.txData?.to || !zap.txData?.data) {
    throw new Error('Soul Zap did not return txData (check amount, token, and bond liquidity)')
  }

  const transactions: PreparedTransaction[] = []

  if (!isPrincipal) {
    const client = createPublicClient({ chain: base, transport: http(BASE_RPC) })
    const spender = SOUL_ZAP_TOKEN_MANAGER_BASE
    const allowance = await client.readContract({
      address: opts.fromToken as `0x${string}`,
      abi: erc20Abi as typeof erc20Abi,
      functionName: 'allowance',
      args: [opts.from as `0x${string}`, spender],
    })
    if (BigInt(allowance as bigint) < BigInt(fromAmount)) {
      const approveData = encodeFunctionData({
        abi: erc20Abi as typeof erc20Abi,
        functionName: 'approve',
        args: [spender as `0x${string}`, BigInt(fromAmount)],
      })
      transactions.push(tx('approve-zap', opts.fromToken, approveData))
    }
  }

  transactions.push(tx('zap', zap.txData.to, zap.txData.data as `0x${string}`))
  return { transactions }
}
