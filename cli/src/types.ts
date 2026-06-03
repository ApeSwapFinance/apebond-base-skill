export interface PreparedTransaction {
  step: string
  to: `0x${string}`
  data: `0x${string}`
  value: `0x${string}`
  chainId: number
}

export interface PrepareResponse {
  transactions: PreparedTransaction[]
}

export interface RealtimeBond {
  chainId?: number
  contractAddress?: Record<number, string>
  billAddress?: string
  billVersion?: string
  soldOut?: boolean
  trueBillPrice?: string
  trueBondPrices?: Array<{ points: string; trueBondPrice: string }>
  lpToken?: {
    symbol?: string
    decimals?: Record<number, number>
    address?: Record<number, string>
  }
  earnToken?: { symbol?: string }
  minTier?: number
  tierBoostRate?: number
  billType?: string
  tokensRemaining?: string
}

export interface BondsListResponse {
  bonds: RealtimeBond[]
}
