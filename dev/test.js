const Blockchain = require('./blockchain');
const bitcoin = new Blockchain();

const previousBlockHash = 'ADSDSDSDD768NJBSHJBDJ';
const currentBlockData = [
    {
        amount:10,
        sender:'ADSDSDD876BNB',
        recipent:'NJIJ465GVHH'
    },
    {
        amount:110,
        sender:'ASDSDDSDSDD876BNB',
        recipent:'NJIzBNVNJ465GVHH'
    },
    {
        amount:120,
        sender:'ADSDSDD876VTYUGIHBNB',
        recipent:'NJIJ465GVHXTYFUGYVH'
    }
]

// console.log(bitcoin.hashBlock(previousBlockHash, currentBlockData, bitcoin.proofOfWork(previousBlockHash,currentBlockData)));
console.log(bitcoin)