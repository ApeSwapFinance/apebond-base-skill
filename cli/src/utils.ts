import BigNumber from 'bignumber.js'
import { API_V2, BASE_BILL_NFT, CHAIN_ID_BASE } from './constants.js'

export function adjustDecimals(numStr: string): string {
  const parts = numStr.split('.')
  if (parts.length < 2) return numStr
  if (parts[1].length > 18) {
    parts[1] = parts[1].slice(0, 18)
    return `${parts[0]}.${parts[1]}`
  }
  return numStr
}

export function convertToBigish(numberString: string, decimals: number): string {
  const adjusted = adjustDecimals(numberString)
  return new BigNumber(adjusted).times(new BigNumber(10).pow(decimals)).toFixed(0)
}

export function resolveTrueBondPrice(bond: {
  trueBillPrice?: string
  trueBondPrices?: Array<{ points: string; trueBondPrice: string }>
}): string {
  if (bond.trueBillPrice) return bond.trueBillPrice
  const tiers = bond.trueBondPrices ?? []
  const zeroTier = tiers.find((t) => t.points === '0')
  if (zeroTier?.trueBondPrice) return zeroTier.trueBondPrice
  if (tiers.length > 0) {
    return tiers.reduce((best, t) =>
      new BigNumber(t.trueBondPrice).gt(best.trueBondPrice) ? t : best,
    ).trueBondPrice
  }
  throw new Error('Bond payload missing trueBillPrice / trueBondPrices')
}

export function computeMaxPrice(trueBondPrice: string): string {
  return new BigNumber(trueBondPrice).times(102).div(100).toFixed(0)
}

export function getBondContract(bond: { contractAddress?: Record<number, string>; billAddress?: string }, chainId: number): string {
  const addr = bond.contractAddress?.[chainId] ?? bond.billAddress
  if (!addr) throw new Error('Bond contract address not found in payload')
  return addr
}

export function normalizeAddress(addr: string): `0x${string}` {
  return addr.toLowerCase() as `0x${string}`
}

/** api.ape.bond redirects (302) to the bond NFT image (IPFS/CDN). */
export function billImageRedirectUrl(billId: string | number): string {
  return `${API_V2}/bills/single/${CHAIN_ID_BASE}/${BASE_BILL_NFT}/${billId}/image`
}
