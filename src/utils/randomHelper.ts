import { v4 } from "uuid";
import crypto from 'crypto';
// https://gist.github.com/joepie91/7105003c3b26e65efcea63f3db82dfba

export const random0To1Double = (): number => {
  const num = randomIntegerInner();
  return (num % 10000000) / 10000000.0;
};

export const randomInteger = (): number => {
  return randomIntegerInner();
};

let increaseNumber = 1;
const randomIntegerInner = (): number => {
  let num = 1;
  const uuid = v4();
  const bytes = crypto.randomBytes(uuid.length);
  for (let i = 0; i < uuid.length; i++) {
    const singleChar = uuid[i];
    const byte = bytes[i];
    num = num + singleChar.charCodeAt(0) * (byte + 1) * (byte + 1);
  }
  let random = Math.random();
  random = random * 10000000000;
  increaseNumber++;
  const realRandom = (random + num) + increaseNumber;
  return Math.floor(realRandom);
};
