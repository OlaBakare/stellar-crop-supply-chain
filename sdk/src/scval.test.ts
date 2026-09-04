import { describe, expect, it } from 'vitest';
import {
  Keypair,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
import {
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
