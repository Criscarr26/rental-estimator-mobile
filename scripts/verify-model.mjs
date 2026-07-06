// Checks the TypeScript prediction against the reference predictions made by
// the real Python pipeline (embedded in model_params.json by export_model.py).
// Requires Node 23.6+ (native TypeScript type stripping): node scripts/verify-model.mjs

import { readFileSync } from 'node:fs';

import { predictPrice } from '../src/lib/model.ts';

const params = JSON.parse(
  readFileSync(new URL('../assets/model_params.json', import.meta.url), 'utf8')
);

let failed = 0;
for (const { input, expected } of params.reference_cases) {
  const got = predictPrice(params, input);
  const diff = Math.abs(got - expected);
  const status = diff < 0.01 ? 'OK ' : 'FAIL';
  console.log(
    `${status} ${input.sector.padEnd(12)} expected ${expected.toFixed(2)}, got ${got.toFixed(2)} (diff ${diff.toExponential(2)})`
  );
  if (diff >= 0.01) failed += 1;
}

if (failed > 0) {
  console.error(`${failed} reference case(s) do not match the Python pipeline.`);
  process.exit(1);
}
console.log('All reference cases match the Python pipeline.');
