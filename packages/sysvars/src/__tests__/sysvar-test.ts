import type { GetAccountInfoApi } from '@solana/rpc-api';
import type { Rpc } from '@solana/rpc-spec';

import { fetchEncodedSysvarAccount, fetchJsonParsedSysvarAccount, SYSVAR_CLOCK_ADDRESS } from '../sysvar';
import { createLocalhostSolanaRpc } from './__setup__';

describe('sysvar account', () => {
    let rpc: Rpc<GetAccountInfoApi>;
    beforeEach(() => {
        rpc = createLocalhostSolanaRpc();
    });
    const assertValidEncodedSysvarAccount = async (address: Parameters<typeof fetchEncodedSysvarAccount>[1]) => {
        const account = await fetchEncodedSysvarAccount(rpc, address);
        expect(account.address).toEqual(address);
        expect(account.exists).toBe(true);
        expect(account).toMatchObject({
            data: expect.any(Uint8Array),
        });
    };
    const assertValidJsonParsedSysvarAccount = async (
        address: Parameters<typeof fetchEncodedSysvarAccount>[1],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any,
    ) => {
        const account = await fetchJsonParsedSysvarAccount(rpc, address);
        expect(account.address).toEqual(address);
        expect(account.exists).toBe(true);
        expect(account).toMatchObject(data);
    };
    describe('clock', () => {
        it('fetch encoded', async () => {
            expect.assertions(3);
            await assertValidEncodedSysvarAccount(SYSVAR_CLOCK_ADDRESS);
        });
        it('fetch JSON-parsed', async () => {
            expect.assertions(3);
            await assertValidJsonParsedSysvarAccount(SYSVAR_CLOCK_ADDRESS, {
                data: {
                    epoch: expect.any(BigInt),
                    epochStartTimestamp: expect.any(BigInt),
                    leaderScheduleEpoch: expect.any(BigInt),
                    slot: expect.any(BigInt),
                    unixTimestamp: expect.any(BigInt),
                },
            });
        });
    });
});
