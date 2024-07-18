import { useState } from 'react';
import server from './server';
import * as secp from 'ethereum-cryptography/secp256k1';
import { secp256k1 } from 'ethereum-cryptography/secp256k1';
import { toHex, utf8ToBytes } from 'ethereum-cryptography/utils';
import { keccak256 } from 'ethereum-cryptography/keccak';

function Transfer({ address, setBalance, privateKey }) {
  const [sendAmount, setSendAmount] = useState('');
  const [recipient, setRecipient] = useState('');

  const setValue = (setter) => (evt) => setter(evt.target.value);

  const hashMessage = (message) => {
    const msgUint8 = utf8ToBytes(JSON.stringify(message));
    const msgHash = keccak256(msgUint8);
    return toHex(msgHash);
  };

  const signMessage = (message) => {
    const msgHash = hashMessage(message);
    const signature = secp.secp256k1.sign(msgHash, privateKey);
    return {
      r: signature.r.toString(),
      s: signature.s.toString(),
      recovery: signature.recovery,
    };
  };

  async function transfer(evt) {
    evt.preventDefault();

    const message = { amount: parseInt(sendAmount), recipient };
    const signature = signMessage(message);
    console.log(signature);

    try {
      const {
        data: { balance },
      } = await server.post(`send`, {
        signature,
        message,
        sender: address,
      });
      setBalance(BigInt(balance));
    } catch (ex) {
      console.log(ex.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
