import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv'; // NestJS config mode used instead
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  parseEther,
  http,
  getAddress,
  verifyMessage
} from 'viem';
import { privateKeyToAccount, toAccount, signMessage, signTransaction, signTypedData } from 'viem/accounts';


import * as chains from 'viem/chains';
import * as tokenJson from './assets/MyToken.json';

dotenv.config();

// Environment Variables
const infuraApiKey = process.env.INFURA_API_KEY || ''; // NestJS config mode used instead

// Injectable decorator to allow dependency injection
@Injectable()
export class AppService {
  private rpcEndpointUrl: string;
  publicClient;
  walletClient;

  constructor(private configService: ConfigService) {
    this.setupPublicClient();
    this.setupWalletClient();
  }

  private setupPublicClient() {
    const network = this.configService.get<string>('INFURA_RPC_URL');
    const apiKey = this.configService.get<string>('INFURA_API_KEY');
    this.rpcEndpointUrl = `${network}${apiKey}`;
    this.publicClient = createPublicClient({
      chain: chains.sepolia,
      transport: http(this.rpcEndpointUrl),
    });
  }

  private setupWalletClient() {
    const privateKey = this.configService.get<string>('PRIVATE_KEY');
    

    const account = privateKeyToAccount(`0x${privateKey}`);
    
    // Create an account object

    /*
    const account = toAccount({
      address: getAddress( privateKey as `0x${string}` ),

      // sign message
      async signMessage({ message }) {
        return signMessage({ message, privateKey: privateKey as `0x${string}` })
      },
      // sign transaction
      async signTransaction(transaction, { serializer }) {
        return signTransaction({ privateKey: privateKey as `0x${string}`, transaction, serializer })
      },
      async signTypedData(typedData) {
        return signTypedData({ ...typedData, privateKey: privateKey as `0x${string}` })
      },

    });*/

    this.walletClient = createWalletClient({
      account,
      chain: chains.sepolia,
      transport: http()
    });
  }

  // Function to get the total supply of the token
  async getTotalSupply(): Promise<any> {
    const publicClient = createPublicClient({
      chain: chains.sepolia,
      transport: http(`${this.rpcEndpointUrl}`),
    });
    const getTotalSupply = await publicClient.readContract({
      address: this.getContractAddress() as `0x${string}`,
      abi: tokenJson.abi,
      functionName: 'totalSupply',
    });
    return formatEther(getTotalSupply as bigint);
  }

  // Function to get the token balance of an address
  async getTokenBalance(address: string): Promise<string> {
    try {
      const balance = await this.publicClient.readContract({
        address: this.getContractAddress() as `0x${string}`,
        abi: tokenJson.abi,
        functionName: 'balanceOf',
        args: [address], // Address whose balance we want to query
      });
      return formatEther(balance); // Convert balance from wei to ether (adjust based on your token's decimals if not 18)
    } catch (error) {
      console.error('Error fetching token balance:', error);
      throw new Error('Failed to fetch token balance');
    }
  }

  // Function to get the transaction receipt
  async getTransactionReceipt(hash: string): Promise<any> {
    try {
      const receipt = await this.publicClient.getTransactionReceipt({
        hash: hash, // Use the hash parameter passed to the function
      });

      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      // Convert BigInt properties to strings
      const receiptStr = this.convertBigIntToString(receipt);

      return receiptStr;
    } catch (error) {
      console.error('Error fetching transaction receipt:', error);
      throw new Error('Failed to fetch transaction receipt');
    }
  }

  // Function to convert BigInt properties to strings
  convertBigIntToString(obj: any): any {
    for (let key in obj) {
      if (typeof obj[key] === 'bigint') {
        obj[key] = obj[key].toString();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        obj[key] = this.convertBigIntToString(obj[key]); // Recursive call for nested objects
      }
    }
    return obj;
  }

  // Function to get the hello message
  getHello(): string {
    return 'Hello World!';
  }

  // Function to get a fixed contract address
  getContractAddress(): string {
    return this.configService.get<string>('TOKEN_ADDRESS');
  }

  // Function to get the token name
  async getTokenName(): Promise<any> {
    const publicClient = createPublicClient({
      chain: chains.sepolia,
      transport: http(`${this.rpcEndpointUrl}`),
    });
    const name = await publicClient.readContract({
      address: this.getContractAddress() as `0x${string}`,
      abi: tokenJson.abi,
      functionName: 'name',
    });
    return name;
  }

  async getServerWalletAddress() {
    const [address] = await this.walletClient.getAddresses();
    return address.account.address;
  }

  // Emppty check minter role function
  checkMinterRole(address: string): Promise<any> {
    return;
  }

  // Function to mint tokens
  async mintTokens(address: string): Promise<string> {
    // Define a fixed amount to mint, e.g., 100 tokens
    const fixedAmount = "50"; // This could also be a configuration option
    const tokenAmount = parseEther(fixedAmount); // Converting the amount to the appropriate format
    const tokenContractAddress = this.configService.get<string>('TOKEN_ADDRESS');
    const abi = tokenJson.abi;

    try {
      const txResponse = await this.walletClient.writeContract({
        address: tokenContractAddress,
        abi: abi,
        functionName: 'mint',
        args: [address, tokenAmount],
      });

      // Wait for the transaction to be mined
      //const receipt = await this.walletClient.waitForTransactionReceipt({ hash: txResponse });
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txResponse });
      console.log(`Tokens minted successfully to address ${address}. Transaction Hash: ${receipt.transactionHash}`);
      return `Tokens minted successfully to address ${address}. Transaction Hash: ${receipt.transactionHash}`;
    } catch (error) {
      console.error('Failed to mint tokens:', error);
      throw new Error('Failed to mint tokens');
    }
  }
}
