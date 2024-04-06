import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv'; // NestJS config mode used instead
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
} from 'viem';
import * as chains from 'viem/chains';
import * as tokenJson from './assets/MyToken.json';

dotenv.config(); 

// Environment Variables
const infuraApiKey = process.env.INFURA_API_KEY || ''; // NestJS config mode used instead

// Injectable decorator to allow dependency injection
@Injectable()
// AppService class
export class AppService {
  private rpcEndpointUrl: string;
  publicClient;
  walletClient;

  constructor(private configService: ConfigService) {
    this.setupPublicClient();
    this.setupWalletClient();
    const network = this.configService.get<string>('INFURA_RPC_URL');
    const apiKey = this.configService.get<string>('INFURA_API_KEY');
    console.log('network--------', network);
    this.rpcEndpointUrl = `${network}${apiKey}`;
  }

  private setupWalletClient() {
    const privateKey = this.configService.get<string>('PRIVATE_KEY');
    if (!privateKey) {
      console.log('test-----------------------');
      throw new Error('Private key not found in configuration.');
    }
    // Ensure the privateKey has the '0x' prefix
    /*if (!privateKey.startsWith('0x')) {
    throw new Error('Invalid private key format. The private key must start with 0x.');
  }
  */

    this.walletClient = createWalletClient({
      chain: chains.sepolia,
      transport: http(),
      key: privateKey, // Correctly pass the privateKey here.
    });
  }

  private setupPublicClient() {
    this.publicClient = createPublicClient({
      chain: chains.sepolia,
      transport: http(this.rpcEndpointUrl),
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

  // Empty mint tokens function
  mintTokens(address: any) {
    // ähnlich Castvote von project 2 (write contract funciton)
    return `Minted tokens for address: ${address}`;
  }
}
