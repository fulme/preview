# 以太坊应用实践

# 目录
- 以太坊简介
- 网络部署
  - 源码编译
  - 节点部署
    - 准备账号
    - 创始区块配置
    - 初始化节点
    - 运行节点
    - 节点互联
    - 远程调用
- 智能合约
  - 智能合约简介
  - solidity简介
  - 代币
    - ERC-20
    - ERC-721
  - 合约部署

# 以太坊简介
以太坊是一个开源的有智能合约功能的公共区块链平台，通过其专用加密货币以太币提供去中心化的虚拟机来处理点对点合约。
其核心技术类似于比特币，可参考[比特币核心架构](https://github.com/fulme/preview/blob/master/doc/blockchain/README.md)。
以太坊通常被称为区块链-2.0应用，相对于比特币网络，主要有一下几个方面的升级、改造。

- 区块产生速度及并发
  比特币的并发6.7笔/秒，每10分钟一个区块，以太坊调整了区块大小及15秒的出块速度，并发达到25笔/秒。
  
- 内存依赖
  比特币挖矿，催生了专用集成电路的矿机产业，以太坊在算法上强依赖大内存，一定程度避免类似的问题。
  
- 图灵完备
  比特币为了防止程序无限循环，对脚本语言做了严格的限制，只能使用非常有限的操作。
  以太坊脚本是图灵完备的，通过引入`gas`解决无限循环问题，理论上可以实现任何逻辑的状态转换。

# 网络部署
## 源码编译
```shell
  git clone git@github.com:fulme/go-ethereum.git
  
  cd go-ethereum
  
  make all
  
  geth cmd ...
```

## 节点部署
下面的流程仅仅是为了演示，详细的操作请参考[这里](https://bigishdata.com/2017/12/15/how-to-write-deploy-and-interact-with-ethereum-smart-contracts-on-a-private-blockchain/)
### 准备账户
```shell
  # 以命令行方式启动geth
  geth console
  
  # 新建账户（两次输入密码）
  personal.newAccount();
  
  # 查看钱包，这里会列出钱包的私钥存放地址
  # 这个后面通过远程调用控制节点账户时会用到
  # /Library/Ethereum/keystore/UTC--2018-05-22T13-49-39.063808000Z--f8cdd6a7ca227c3bba5a9954b225847af0dd9726
  personal.listWallets
```

### 创始块配置
`genesis.json`
```json
  {
    "alloc": {
      "a28be83e73e67728fe28ea1e775e81bcaf9012c0": {
        "balance": "12000000000000000000000000000"
      }
    },
    "config": {
       "chainID": 72,
       "homesteadBlock": 0,
       "eip155Block": 0,
       "eip158Block": 0
     },
     "nonce": "0x0000000000000000",
     "difficulty": "0x4000",
     "mixhash": "0x0000000000000000000000000000000000000000000000000000000000000000",
     "coinbase": "0x0000000000000000000000000000000000000000",
     "timestamp": "0x00",
     "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
     "extraData": "0x11bbe8db4e347b4e8c937c1c8370e4b5ed33adb3db69cbdb7a38e1e50b1b82fa",
     "gasLimit": "0xffffffff"
  }
```

### 初始化节点
```shell
  // 部署一个节点
  geth --datadir "privEth1" init genesis.json
  
  // 部署另外一个节点
  geth --datadir "privEth2" init genesis.json
```

### 运行节点
```shell
  # 运行节点
  geth --datadir "privEth1" --port 30301 --nodiscover console
  
  # 节点开启RPC
  geth --datadir "privEth1" --port 30301 --nodiscover --rpc 
  --rpcaddr 127.0.0.1 --rpcport 8545 --rpcapi "eth,miner,net,web3,personal,admin" console
```

### 节点互联
```shell
  # 启动节点1
  geth --datadir "privEth1" --port 30301 --nodiscover console
  
  # 查看节点信息
  # enode://1ef02eb050c...
  admin.nodeInfo.enode
  
  # 启动另外一个节点2
  geth --datadir "privEth2" --port 30302 --nodiscover console
  # 添加节点1的节点信息到节点2
  admin.addPeer("enode://1ef02eb050c...")
  
  # 至此节点1就可以连接上节点2了
  # 节点2要连接节点1同理
```

### 远程调用
- 普通钱包用户
钱包可以通过`rpcApi`接口，实现简单验证、转账、花费等操作和管理。

- 应用程序调用
应用程序可以通过`rpcApi`接口，控制节点账号，需要将钱包私钥拷贝到节点目录下的`keystore`目录下，
这样应用程序就可以只提供私钥的密码而不需要保存私钥，就可以实现对该账号的转账、付款等操作。
下面是一个后台`nodejs`应用程序控制节点账户的例子：
```js
const express = require('express');
const bodyParser = require('body-parser');
const Web3 = require('web3');
const web3Admin = require('web3Admin');
const mustacheExpress = require('mustache-express');

const rpcServer = 'http://123.57.248.145:8545';
const coinbase = 'a28be83e73e67728fe28ea1e775e81bcaf9012c0';
const pwd = 'pwd3';
const web3 = new Web3();

web3.setProvider(new web3.providers.HttpProvider(rpcServer));

app.post('/transfer', (req, res) => {
  if (!web3.eth.mining) {
    web3.miner.start();
  }

  web3.personal.unlockAccount(coinbase, pwd, (err, uares) => {
    if (err) {
      console.log(err, uares);
    } else {
      users.forEach((user) => {
        web3.eth.sendTransaction({
          from: coinbase,
          to: user.address,
          value: user.value
        }, (err, result) => {
          console.log(err, result);
        });
      });
    }
  });
});
```

# 智能合约
经过上面的步骤，以太坊网络已经部署好了，`XX币`也是想要多少就有多少，
下面正式进入以太坊最有魅力的部分：**智能合约**，这也是以太坊最重要的技术贡献。
以太坊合约的代码使用低级的基于堆栈的字节码的语言写成的，被称为`EVM代码`，类似于汇编语言。

## 智能合约简介
智能合约，是一种旨在以信息化方式传播、验证或执行合同的计算机协议。
智能合约允许在没有第三方的情况下进行可信交易，这些交易可追踪且不可逆转。
举个栗子，一个人可能有一个存储合约，形式为“A可以每天最多提现X个币，B每天最多Y个，A和B一起可以随意提取，A可以停掉B的提现权”。

## solidity简介
`solidity`是目前官网推崇的编写智能合约的高级语言。语法类似于`javascript`。详细语法、API参见：[官网](http://solidity.readthedocs.io/en/v0.4.13/)
快速入门推荐：[手把手教程](https://cryptozombies.io/)
可以用任何文本编辑器编写`solidity`代码，不过推荐使用官方[remix](https://remix.ethereum.org/)，除了有各平台的IDE客户端外，
其[在线编辑器](http://remix.ethereum.org/#optimize=false&version=builtin)非常方便且强大，可以直接在线部署和接口调用（需要安装[metamsk浏览器插件](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn)）。

## 智能合约示例
```solidity
  pragma solidity ^0.4.0;
  contract Questions {
  
    mapping(address => uint) public answers;
    string question;
    address asker;
    uint trues;
    uint falses;
  
    function Questions(string _question) public {
      asker = msg.sender;
      question = _question;
    }
  
    function answerQuestion (bool _answer) public {
      if (answers[msg.sender] == 0 && _answer) { //haven't answered yet
        answers[msg.sender] = 1; //they vote true
        trues += 1;
      }
      else if (answers[msg.sender] == 0 && !_answer) {
        answers[msg.sender] = 2; //falsity
        falses += 1;
      }
      else if (answers[msg.sender] == 2 && _answer) { // false switching to true
        answers[msg.sender] = 1; //true
        trues += 1;
        falses -= 1;
      }
      else if (answers[msg.sender] == 1 && !_answer) { // true switching to false
        answers[msg.sender] = 2; //falsity
        trues -= 1;
        falses += 1;
      }
    }
  
    function getQuestion() public constant returns (string, uint, uint, uint) {
      return (question, trues, falses, answers[msg.sender]);
    }
  }
```

## 代币
以太坊系统中，存在作为基础货币的“Ether”（以太），以及同样可以作为货币使用的Token。
以太坊系统是一个平台，类似于一个游乐场，游乐场中可以有各种不同的游戏机，而Token就相当于某种游戏机的游戏币。
原则上，每一个智能合约可以自己定义一套Token的操作接口，但对于普通钱包、交易所及与其他DAPP的交易不兼容。
因此，以太坊核心定义了一套代币的标准协议，这样就可以在所有的钱包、交易所进行代币的统一管理。
在以太坊系统中有两种主要的代币协议：[ERC-20]((https://eips.ethereum.org/EIPS/eip-20))和[ERC-721](https://eips.ethereum.org/EIPS/eip-721)。

### ERC-20
`ERC-20`定义了以太坊代币标准，于2015-11-9完成投票通过，任何`ERC-20`代币都能立即兼容以太坊钱包。
由于交易所已经知道这些代币是如何操作的，它们可以很容易地整合这些代币。
这就意味着，在很多情况下，这些代币都是可以立即进行交易的。
到目前（2018-5-23）为止已经有 **85838** 种支持`ERC-20`标准的智能合约，最高市值高达百亿美金。
[这里](https://etherscan.io/tokens)可以查看所有`ERC-20`代币的详细情况。
```solidity
contract ERC20Interface {
    // Optional
    // function name() view returns (string name);
    // function symbol() view returns (string symbol);
    // function decimals() view returns (uint8 decimals);
    
    function totalSupply() public constant returns (uint);
    function balanceOf(address tokenOwner) public constant returns (uint balance);
    function allowance(address tokenOwner, address spender) public constant returns (uint remaining);
    function transfer(address to, uint tokens) public returns (bool success);
    function approve(address spender, uint tokens) public returns (bool success);
    function transferFrom(address from, address to, uint tokens) public returns (bool success);

    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
}
```
### ERC-721
`ERC-721`同样是一个代币标准，官方简要解释是`Non-Fungible Tokens`，简写为NFTs，多翻译为非同质代币。
与`ERC-20`的区别在于，`ERC-20`代币是可置换（及同质），可细分（1=10*0.1），而每一个`ERC-721`代币都是唯一、不可置换、不可细分（最小单位为1）的。
以`ERC-721`最知名的应用[加密猫](https://www.cryptokitties.co)举例：
一只加密猫与另外一只加密猫是完全不一样的，不可能置换，也不可以对猫进行拆分，这种独特性使得某些稀有的猫极具收藏价值，受到人们追捧，最高的卖到几十万美金。

```solidity
contract ERC721 {
    // Required methods
    function totalSupply() public view returns (uint256 total);
    function balanceOf(address _owner) public view returns (uint256 balance);
    function ownerOf(uint256 _tokenId) external view returns (address owner);
    function approve(address _to, uint256 _tokenId) external;
    function transfer(address _to, uint256 _tokenId) external;
    function transferFrom(address _from, address _to, uint256 _tokenId) external;

    // Events
    event Transfer(address from, address to, uint256 tokenId);
    event Approval(address owner, address approved, uint256 tokenId);

    // Optional
    // function name() public view returns (string name);
    // function symbol() public view returns (string symbol);
    // function tokensOfOwner(address _owner) external view returns (uint256[] tokenIds);
    // function tokenMetadata(uint256 _tokenId, string _preferredTransport) public view returns (string infoUrl);

    // ERC-165 Compatibility (https://github.com/ethereum/EIPs/issues/165)
    function supportsInterface(bytes4 _interfaceID) external view returns (bool);
}
```

## 合约部署
用`solidity`编写的合约还是高级语言代码，要部署到以太坊网络，需要一些列的编译、转换。
好在已经有很多现成的工具，可以很方便地自动完成这个复杂的过程。
部署的方式很多，下面介绍一种简单易用的部署方式：[在线部署](http://remix.ethereum.org/#optimize=false&version=builtin)。
以太坊网络上的交易是需要消耗`gas`的（即以太币），所以需要拥有控制权的以太坊账号，对于普通用户这里需要安装一个[metamask浏览器插件](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn)。
部署合约其实就是发起一个交易，所以需要钱包授权花费的`gas`，合约部署以后会生成一个合约地址，在在线编辑器上可以通过合约地址查看合约的状态及接口调用。
