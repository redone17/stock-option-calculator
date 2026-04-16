// Usage: node scripts/gen-hash.js <password>
import { createHash } from 'crypto';

const pw = process.argv[2];
if (!pw) {
  console.error('Usage: node scripts/gen-hash.js <password>');
  process.exit(1);
}
console.log(createHash('sha256').update(pw).digest('hex'));
