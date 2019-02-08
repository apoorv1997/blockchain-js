const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const Blockchain = require('./blockchain');
const uuid = require('uuid/v1');
const rp = require('request-promise');
const port = process.argv[2];
const nodeAddress = uuid().split('-').join('');

const bitcoin = new Blockchain();

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:false}));


app.get('/blockchain', (req, res) => {
    res.send(bitcoin)

})

app.post('/transaction', (req, res) => {
    const blockIndex = bitcoin.createNewBlock(req.body.amount, req.body.sender, req.body.recipent)
    res.json({
       note:`transaction added in block ${blockIndex}.` 
    })
})

app.get('/mine', () => {
    const lastBlock = bitcoin.getLastBlock();
    const previousBlockHash = lastBlock['hash'];
    const currentBlockData = {
        transactions: bitcoin.pendingTransactions,
        index: lastBlock['index'] + 1,
    };
    const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = bitcoin.hashBlock(previousBlockHash,currentBlockData,nonce);
    bitcoin.createNewTransaction(12.5, "00", nodeAddress);
    const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);
    res.json({
        note:'new block created',
        block: newBlock
    })

})

app.post('/register-and-broadcast-node', (req,res) => {
    const newNodeUrl = req.body.newNodeUrl;
    if(bitcoin.networkNodes.indexOf(newNodeUrl) == -1) 
        bitcoin.networkNodes.push(newNodeUrl);
    const regNodesPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri:networkNodeUrl+'/register-node',
            method:'POST',
            body: {newNodeUrl:newNodeUrl},
            json:true
        };
        regNodesPromises.push(rp(requestOptions));
    })
    Promise.all(regNodesPromises).then(data => {
        const bulkRegisterOptions = {
            uri:newNodeUrl+'/register-node-bulk',
            method:'POST',
            body:{allNetworkNodes:[...bitcoin.networkNodes, bitcoin.currentNodeUrl]},
            json:true
        };
        return rp(bulkRegisterOptions);
    }).then(data => {
        res.json({note:'new node registered with network successfully.'})
    })
})

app.post('/register-node', (req, res) => {
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
    
    if(nodeNotAlreadyPresent && notCurrentNode) {    
        bitcoin.networkNodes.push(newNodeUrl);
        res.json({note:'new node registered successfully.'})
    }      
})

app.post('/register-node-bulk', (req, res) => {
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach(networkNodeUrl => {
        const nodeNotAlreadyPresent = bitcoin.networkNodeUrl.indexOf(networkNodeUrl) == -1;
        const notCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl;
        if(nodeNotAlreadyPresent && notCurrentNode) bitcoin.networkNodes.push(networkNodeUrl);
    });
    res.json({note:'bulk registration successful.'})
})

app.listen(port, () => {
    
})