import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import { fetchBaseBonds } from './apis.js'
import { BASE_RPC, CHAIN_ID_BASE } from './constants.js'
import { getBondContract } from './utils.js'

const bondAbi = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'getBillIds',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'billId', type: 'uint256' }],
    name: 'claimablePayout',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export interface PositionRow {
  bondContract: string
  earnToken?: string
  billId: string
  claimablePayout: string
}

export async function fetchPositions(owner: string): Promise<PositionRow[]> {
  const bonds = await fetchBaseBonds()
  const client = createPublicClient({ chain: base, transport: http(BASE_RPC) })
  const rows: PositionRow[] = []

  for (const bond of bonds) {
    if (bond.soldOut) continue
    let contract: string
    try {
      contract = getBondContract(bond, CHAIN_ID_BASE)
    } catch {
      continue
    }

    const ids = await client.readContract({
      address: contract as `0x${string}`,
      abi: bondAbi,
      functionName: 'getBillIds',
      args: [owner as `0x${string}`],
    })

    for (const id of ids) {
      if (id === 0n) continue
      const claimable = await client.readContract({
        address: contract as `0x${string}`,
        abi: bondAbi,
        functionName: 'claimablePayout',
        args: [id],
      })
      rows.push({
        bondContract: contract,
        earnToken: bond.earnToken?.symbol,
        billId: id.toString(),
        claimablePayout: claimable.toString(),
      })
    }
  }

  return rows
}
