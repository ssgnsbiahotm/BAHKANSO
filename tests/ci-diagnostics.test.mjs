import assert from 'node:assert/strict';
import test from 'node:test';
import { redactSensitiveText } from '../scripts/collect-ci-diagnostics.mjs';

test('les diagnostics expurgent les JWT, mots de passe et chaînes de connexion', () => {
  const input = [
    'Authorization: Bearer bearer-token-value',
    'password="synthetic-password"',
    'service_role_key=sb_secret_synthetic-value',
    'api_key=synthetic-api-key',
    'refresh_token=synthetic-refresh-token',
    'postgresql://postgres:db-password@127.0.0.1:5432/postgres',
    'eyJhbGciOiJub25lIn0.eyJzdWIiOiJzeW50aGV0aWMifQ.signaturevalue',
  ].join('\n');
  const output = redactSensitiveText(input);

  assert.doesNotMatch(
    output,
    /bearer-token-value|synthetic-password|sb_secret_synthetic-value|synthetic-api-key|synthetic-refresh-token|db-password/,
  );
  assert.match(output, /\[REDACTED\]/);
  assert.match(output, /\[REDACTED_JWT\]/);
});
