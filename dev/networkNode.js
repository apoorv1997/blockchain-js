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
    // const blockIndex = bitcoin.createNewBlock(req.body.amount, req.body.sender, req.body.recipent)
    // res.json({
    //    note:`transaction added in block ${blockIndex}.` 
    // })
    const newTransaction = req.body;
    const blockIndex = bitcoin.addTransactionToPendingTransactions(newTransaction);
    res.json({note:`transaction will be added in block ${blockIndex}.`})
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
    const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);
    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri:networkNodeUrl+'/receive-new-block',
            method:'POST',
            body:{newBlock:newBlock},
            json:true
        }
        requestPromises.push(rp(requestOptions));
    })
    Promise.all(requestPromises).then(data => {
        const requestOptions = {
            uri:bitcoin.currentNodeUrl+'/transaction/broadcast',
            method:'POST',
            body:{
                amount:12.5,
                sender:"00",
                recipent:nodeAddress
            },
            json:true
        };
        return rp(requestOptions);
    }).then(data => {
        res.json({
            note:'new block created',
            block: newBlock
        })
    })
})

app.post('/receive-new-block', (req, res) => {
    const newBlock = req.body.newBlock;
    const lastBlock = bitcoin.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock['index']+1 === newBlock['index'];
    if(correctHash && correctIndex) {
        bitcoin.chain.push(newBlock);
        bitcoin.pendingTransactions = [];
        res.json({
            note:'new block received and accepted.',
            newBlock:newBlock
        })
    } else {
        res.join({
            note:'new block rejected.',
            newBlock:newBlock
        })
    }
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

app.post('/transaction/broadcast', (req, res) => {
    const newTransaction = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipent);
    bitcoin.addTransactionToPendingTransactions(newTransaction);
    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri:networkNodeUrl+'/transaction',
            method:'POST',
            body:newTransaction,
            json:true
        };
        requesPromises.push(rp(requestOptions));
    });
    Promise.all(requestPromises).then(data => {
        res.json({note:'transaction created and broadcasted successfully.'})
    })
})

app.listen(port, () => {
    
})