'use strict';

// Domain availability sweep.
// Strategy: DNS A-record lookup. If no records resolve, the domain is *probably*
// available — but DNS is NOT authoritative. Always verify on the registrar
// before betting money on a name.
//
// Usage:
//   node scripts/check-domains.js <name1> [<name2> ...]
//   node scripts/check-domains.js --names pleito,jurinbox,patrono
//   node scripts/check-domains.js --tlds com,com.br,app --names pleito,patrono
//
// Output: table with TAKEN / FREE? / ERROR per (name, tld) cell.

const dns = require('dns');
const { promisify } = require('util');

const resolve4 = promisify(dns.resolve4);

const DEFAULT_TLDS = ['com', 'com.br', 'app', 'io', 'legal', 'law'];

function parseArgs(argv) {
  const out = { names: [], tlds: DEFAULT_TLDS };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--names' && argv[i + 1]) {
      out.names = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    } else if (a === '--tlds' && argv[i + 1]) {
      out.tlds = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    } else if (!a.startsWith('--')) {
      out.names.push(a);
    }
  }
  return out;
}

async function checkOne(domain) {
  try {
    const ips = await resolve4(domain);
    return { domain, status: 'TAKEN', detail: ips[0] || '' };
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      return { domain, status: 'FREE?', detail: '' };
    }
    return { domain, status: 'ERROR', detail: err.code || err.message };
  }
}

function colorize(status) {
  if (process.stdout.isTTY) {
    if (status === 'FREE?') return `\x1b[32m${status}\x1b[0m`;
    if (status === 'TAKEN') return `\x1b[31m${status}\x1b[0m`;
    return `\x1b[33m${status}\x1b[0m`;
  }
  return status;
}

function padCell(status, width) {
  const pad = ' '.repeat(Math.max(0, width - status.length));
  return colorize(status) + pad;
}

async function main() {
  const { names, tlds } = parseArgs(process.argv.slice(2));
  if (names.length === 0) {
    console.error('Usage: node check-domains.js <name1> [<name2> ...]');
    console.error('       node check-domains.js --names pleito,jurinbox --tlds com,com.br');
    process.exit(1);
  }

  const widthName = Math.max(8, ...names.map((n) => n.length)) + 2;
  const widthCell = 9;

  const header = ['NAME'.padEnd(widthName), ...tlds.map((t) => `.${t}`.padEnd(widthCell))].join(' ');
  console.log(header);
  console.log('-'.repeat(header.length));

  for (const name of names) {
    const cells = await Promise.all(tlds.map((t) => checkOne(`${name}.${t}`)));
    const row = [name.padEnd(widthName), ...cells.map((c) => padCell(c.status, widthCell))];
    console.log(row.join(' '));
  }

  console.log('');
  console.log('Notes:');
  console.log('  FREE?  = no DNS records — likely available, verify on registrar');
  console.log('  TAKEN  = DNS records exist — registered (and may be active)');
  console.log('  ERROR  = lookup failed (network/timeout) — retry');
  console.log('');
  console.log('Verify before purchasing:');
  console.log('  .com.br → https://registro.br');
  console.log('  .com / .app / .io / .legal / .law → https://www.namecheap.com or your registrar');
  console.log('  Brazil trademark → https://busca.inpi.gov.br/pePI/');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('check-domains failed:', err.message);
    process.exit(1);
  });
}

module.exports = { checkOne, parseArgs, DEFAULT_TLDS };
