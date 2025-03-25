import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "./queryClient";
import { NetworkConfig, Transaction, RoleInfo, BlocklistInfo, ContractEvent } from "./types";

// Base API URL
const BASE_URL = "/api";

// Token Information
export function useTokenInfo() {
  return useQuery({
    queryKey: [`${BASE_URL}/token`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Account Information
export function useAccountInfo(address: string | undefined) {
  return useQuery({
    queryKey: [`${BASE_URL}/account/${address}`],
    enabled: !!address, // Only run the query if address is available
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Transfer tokens
export function useTransferMutation() {
  return useMutation({
    mutationFn: async ({ to, amount }: { to: string; amount: string }) => {
      const res = await apiRequest("POST", `${BASE_URL}/transfer`, { to, amount });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`${BASE_URL}/token`] });
    },
  });
}

// Mint tokens
export function useMintMutation() {
  return useMutation({
    mutationFn: async ({ to, amount }: { to: string; amount: string }) => {
      const res = await apiRequest("POST", `${BASE_URL}/mint`, { to, amount });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`${BASE_URL}/token`] });
    },
  });
}

// Burn tokens
export function useBurnMutation() {
  return useMutation({
    mutationFn: async ({ from, amount }: { from: string; amount: string }) => {
      const res = await apiRequest("POST", `${BASE_URL}/burn`, { from, amount });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`${BASE_URL}/token`] });
    },
  });
}

// Pause contract
export function usePauseMutation() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `${BASE_URL}/pause`, {});
      return res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`${BASE_URL}/token`] });
    },
  });
}

// Unpause contract
export function useUnpauseMutation() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `${BASE_URL}/unpause`, {});
      return res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`${BASE_URL}/token`] });
    },
  });
}

// Block account
export function useBlockAccountMutation() {
  return useMutation({
    mutationFn: async (account: string) => {
      const res = await apiRequest("POST", `${BASE_URL}/block`, { account });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      // Would need to invalidate specific account info if we had that query
    },
  });
}

// Unblock account
export function useUnblockAccountMutation() {
  return useMutation({
    mutationFn: async (account: string) => {
      const res = await apiRequest("POST", `${BASE_URL}/unblock`, { account });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      // Would need to invalidate specific account info if we had that query
    },
  });
}

// Update reward multiplier
export function useUpdateRewardMultiplierMutation() {
  return useMutation({
    mutationFn: async (value: string) => {
      const res = await apiRequest("POST", `${BASE_URL}/reward-multiplier`, { value });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`${BASE_URL}/token`] });
    },
  });
}

// Grant role
export function useGrantRoleMutation() {
  return useMutation({
    mutationFn: async ({ account, role }: { account: string; role: string }) => {
      const res = await apiRequest("POST", `${BASE_URL}/grant-role`, { account, role });
      return res.json();
    },
  });
}

// Revoke role
export function useRevokeRoleMutation() {
  return useMutation({
    mutationFn: async ({ account, role }: { account: string; role: string }) => {
      const res = await apiRequest("POST", `${BASE_URL}/revoke-role`, { account, role });
      return res.json();
    },
  });
}

// Check if account has role
export function useHasRole(account: string | undefined, role: string) {
  return useQuery({
    queryKey: [`${BASE_URL}/has-role/${account}/${role}`],
    enabled: !!account && !!role,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get transaction details
export function useTransaction(txHash: string | undefined) {
  return useQuery({
    queryKey: [`${BASE_URL}/transaction/${txHash}`],
    enabled: !!txHash,
  });
}

// Get contract events
export function useContractEvents(options?: {
  fromBlock?: number;
  toBlock?: number;
  limit?: number;
  eventName?: string;
}) {
  const queryParams = new URLSearchParams();
  
  if (options?.fromBlock) queryParams.set('fromBlock', options.fromBlock.toString());
  if (options?.toBlock) queryParams.set('toBlock', options.toBlock.toString());
  if (options?.limit) queryParams.set('limit', options.limit.toString());
  if (options?.eventName) queryParams.set('eventName', options.eventName);
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  return useQuery<{ events: ContractEvent[], range: { fromBlock: number, toBlock: number, totalBlocks: number, totalEvents: number, hasMore: boolean } }>({
    queryKey: [`${BASE_URL}/events${queryString}`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}