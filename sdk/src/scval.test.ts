import { describe, expect, it, vi } from 'vitest';
import {
  Keypair,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
import {
  CropSupplyClient,
  OrderStatus,
  encodeAddress,
  encodeI128,
  encodeStatus,
  encodeString,
  encodeU32,
  encodeU64,
  decodeAddrValue,
  decodeU64Value,
  decodeVecU64,
} from './client';
import { ContractStatus } from './client';

const VALID_ADDRESS = Keypair.random().publicKey();

describe('ScVal encoding helpers', () => {
  it('encodes a G-address as a scvAddress that decodes back', () => {
    const scv = encodeAddress(VALID_ADDRESS);
    expect(scv.switch()).toBe(xdr.ScValType.scvAddress());
    expect(decodeAddrValue(scv)).toBe(VALID_ADDRESS);
  });

  it('encodes u64 values that decode back via native conversion', () => {
    const scv = encodeU64(42);
    expect(scValToNative(scv)).toBe(42n);
  });

  it('encodes i128 values that decode back via native conversion', () => {
    const scv = encodeI128('9007199254740993');
    expect(scValToNative(scv)).toBe(9007199254740993n);
  });

  it('encodes u32 values that decode back as numbers', () => {
    const scv = encodeU32(20);
    expect(scValToNative(scv)).toBe(20);
  });

  it('encodes strings that decode back', () => {
    const scv = encodeString('wheat harvest Q3');
    expect(scValToNative(scv)).toBe('wheat harvest Q3');
  });

  it('encodes status as a symbol that decodes back', () => {
    const scv = encodeStatus(ContractStatus.Active);
    expect(scv.switch()).toBe(xdr.ScValType.scvSymbol());
    expect(scValToNative(scv)).toBe('Active');
  });

  it('decodeU64Value returns a decimal string', () => {
    const scv = encodeU64('123456789');
    expect(decodeU64Value(scv)).toBe('123456789');
  });
});

describe('decodeVecU64', () => {
  it('decodes a vec of u64s into an array of BigInt', () => {
    const scv = nativeToScVal([10, 20, 30]);
    expect(decodeVecU64(scv)).toEqual([10n, 20n, 30n]);
  });

  it('returns an empty array for a single non-vector value', () => {
    expect(decodeVecU64(encodeU32(5))).toEqual([]);
  });
});

describe('CropSupplyClient.watchOrderStatus', () => {
  it('polls getOrder and invokes callback only when status changes until stopped', async () => {
    vi.useFakeTimers();
    try {
      const client = new CropSupplyClient({
        rpcUrl: 'https://soroban-testnet.stellar.org',
        networkPassphrase: 'Test SDF Network ; September 2015',
        contractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
        signer: Keypair.random(),
      });

      const baseOrder = {
        id: '1',
        contractId: '1',
        buyer: VALID_ADDRESS,
        amount: '10000000',
        orderedAt: '1700000000',
        deliveredAt: null,
        refundedAt: null,
      };

      const getOrderSpy = vi
        .spyOn(client, 'getOrder')
        .mockResolvedValueOnce({ ...baseOrder, status: OrderStatus.Pending })
        .mockResolvedValueOnce({ ...baseOrder, status: OrderStatus.Pending })
        .mockResolvedValueOnce({ ...baseOrder, status: OrderStatus.Shipped })
        .mockResolvedValueOnce({ ...baseOrder, status: OrderStatus.Delivered });

      const observed: OrderStatus[] = [];
      const stop = client.watchOrderStatus(
        '1',
        (status) => {
          observed.push(status);
        },
        1000
      );

      await vi.advanceTimersByTimeAsync(0);
      expect(observed).toEqual([]);

      await vi.advanceTimersByTimeAsync(1000);
      expect(observed).toEqual([]);

      await vi.advanceTimersByTimeAsync(1000);
      expect(observed).toEqual([OrderStatus.Shipped]);

      await vi.advanceTimersByTimeAsync(1000);
      expect(observed).toEqual([OrderStatus.Shipped, OrderStatus.Delivered]);

      stop();
      await vi.advanceTimersByTimeAsync(3000);
      expect(getOrderSpy).toHaveBeenCalledTimes(4);
    } finally {
      vi.useRealTimers();
    }
  });
});
