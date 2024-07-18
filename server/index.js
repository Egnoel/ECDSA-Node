const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;
const { keccak256 } = require('ethereum-cryptography/keccak');
const { utf8ToBytes, toHex } = require('ethereum-cryptography/utils');
const secp = require('ethereum-cryptography/secp256k1');

app.use(cors());
app.use(express.json());

const balances = {
  //private key:2071c048fd0514a9fba600e40075a58970e4c9d63c8f09510b6b94ab772538eb
  '03c9adf037a6a09a5b992663f2d813549f93f78c2087dae0d840bb1f358a5bc17d': 100n,
  //private key:e709aa8dbbd7eda06e0353225b1319855193ee673a0c8492583a8edf1fbe8a77
  '027142d0389e429d876e1a5ea820ffb7014cfb85c2bfde944f388e0c273732a956': 50n,
  //private key:4566c89a91e5f528b62941d52c0e79a6337440861bd861fc84c2be26c49b56d0
  '0392705c6518a2254c02ed575c902b85c14f951b7e08322ac3649ea08678028e3f': 75n,
};

app.get('/balance/:address', (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0n;
  res.send({ balance: balance.toString() });
});

app.post('/send', (req, res) => {
  const { signature, message, sender } = req.body;
  const { amount, recipient } = message;
  const hashMessage = (message) => {
    const msgUint8 = utf8ToBytes(JSON.stringify(message));
    const msgHash = keccak256(msgUint8);
    return toHex(msgHash);
  };

  const hashedMessage = hashMessage(message);
  const signatureObj = {
    r: BigInt(signature.r),
    s: BigInt(signature.s),
    recovery: signature.recovery,
  };

  const isValid = secp.secp256k1.verify(signatureObj, hashedMessage, sender);

  if (!isValid) res.status(400).send({ message: 'Bad signature!' });

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < BigInt(amount)) {
    return res.status(400).send({ message: 'Not enough funds!' });
  } else {
    balances[sender] -= BigInt(amount);
    balances[recipient] += BigInt(amount);
    return res.send({ balance: balances[sender].toString() });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0n;
  }
}
