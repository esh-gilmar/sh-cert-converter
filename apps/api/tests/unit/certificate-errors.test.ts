import { describe, expect, it } from 'vitest';
import { mapOpenSslFailure } from '../../src/modules/certificates/certificate-errors.js';

describe('mapOpenSslFailure', () => {
  it('maps invalid password failures', () => {
    expect(mapOpenSslFailure('Mac verify failure: invalid password?').code).toBe('INVALID_PASSWORD');
  });

  it('maps malformed PFX failures', () => {
    expect(mapOpenSslFailure('ASN1 routines: not enough data').code).toBe('INVALID_PFX');
  });
});
