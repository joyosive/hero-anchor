import solc from 'solc';
import fs from 'fs';
const source = fs.readFileSync('src/HeroProofAnchor.sol','utf8');
const input = {
  language: 'Solidity',
  sources: { 'HeroProofAnchor.sol': { content: source } },
  settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { '*': { '*': ['abi','evm.bytecode.object'] } } }
};
const out = JSON.parse(solc.compile(JSON.stringify(input)));
if (out.errors) {
  const fatal = out.errors.filter(e => e.severity === 'error');
  out.errors.forEach(e => console.log(e.severity.toUpperCase()+':', e.formattedMessage.split('\n')[0]));
  if (fatal.length) { console.log('COMPILE FAILED'); process.exit(1); }
}
const c = out.contracts['HeroProofAnchor.sol']['HeroProofAnchor'];
fs.writeFileSync('offchain/HeroProofAnchor.abi.json', JSON.stringify(c.abi, null, 2));
fs.writeFileSync('offchain/HeroProofAnchor.bytecode.txt', '0x'+c.evm.bytecode.object);
console.log('COMPILE OK — bytecode bytes:', c.evm.bytecode.object.length/2);
console.log('ABI methods:', c.abi.filter(x=>x.type==='function').map(f=>f.name).join(', '));
