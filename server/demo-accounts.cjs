// บัญชีเดโมเก็บเฉพาะ salt และผล scrypt 64 ไบต์
const accounts = new Map([
  [
    'student',
    {
      id: 1,
      salt: '5dcdae88c60d4c603a97a862327f159f',
      hash: Buffer.from(
        '466b1326ec8f9b2a9f8b959b5b49c7208b0e36de95cde00af50b2f65d71a6ca5497cd4ba3cd2abe5df6880ebd992a1c0fd016ee6fe5a0d965319c8dedd04d4f7',
        'hex',
      ),
    },
  ],
  [
    'admin',
    {
      id: 99,
      salt: '05dd403f81c4b72cb0c582135879e8ac',
      hash: Buffer.from(
        '099c1d7b9ab345a1454338f0747ce086fc6abb28afed45af920ef335befd5c1b3dd5ba8f586eb1077fce80e87b23f7c2f0ef8eb34fe1a2585e0cb3ffcbf5ef77',
        'hex',
      ),
    },
  ],
]);

const unknownAccount = {
  salt: '1eb3293620ba08aa2c540398cb4fbd59',
  hash: Buffer.from(
    '13defe7f52ce9c38bae4fe1c6888d37431af84ce079554de58b49ee8ecf68bc72a3561410b9a90c8d56b86066df72a812fa9f85a419995ec9a555069e1ee63a3',
    'hex',
  ),
};

module.exports = { accounts, unknownAccount };
