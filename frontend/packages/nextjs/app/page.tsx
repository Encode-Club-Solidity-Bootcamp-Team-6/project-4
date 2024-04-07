"use client";

import { ReactNode, useEffect, useState } from "react";
import type { NextPage } from "next";
import { hexToString } from "viem";
import { useAccount, useBalance, useContractRead, useContractWrite, useNetwork, useSignMessage } from "wagmi";
import { Address, AddressInput, EtherInput, InputBase, IntegerInput } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const [contractAddresses, setContractAddresses] = useState<ContractAddresses>({
    ballot: "0x91F5E2C2eFA52Aa7a95EfAA0916B7ab6dfA67b88",
    myToken: "0x80DC6B175D08af1d2F11F8396a845267d60eB68a",
  });

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">Tokenized Ballot</span>
          </h1>
          <ExampleAddresses />
          <ContractAddresses value={contractAddresses} onChange={setContractAddresses}></ContractAddresses>
          <InfoSection addresses={contractAddresses} />
          <InteractionSection addresses={contractAddresses} />
        </div>
        <WalletInfo></WalletInfo>
      </div>
    </>
  );
};

const Card: React.FC<{ children: ReactNode; title: string }> = ({ children, title }) => {
  return (
    <div className="card min-w-96 max-w-3xl bg-primary text-primary-content mt-4">
      <div className="card-body">
        <h2 className="card-title">{title}</h2>
        {children}
      </div>
    </div>
  );
};

const ExampleAddresses: React.FC = () => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2 items-center">
        <span className="label-text">MyToken Example: </span>
        <Address size="xs" address="0x80DC6B175D08af1d2F11F8396a845267d60eB68a" format="short" />
      </div>

      <div className="flex gap-2 items-center">
        <span className="label-text">Ballot Example: </span>
        <Address size="xs" address="0x91F5E2C2eFA52Aa7a95EfAA0916B7ab6dfA67b88" format="short" />
      </div>
    </div>
  );
};

type ContractAddresses = {
  myToken: string;
  ballot: string;
};

const ContractAddresses: React.FC<{ value: ContractAddresses; onChange: (val: ContractAddresses) => void }> = ({
  value,
  onChange,
}) => {
  return (
    <Card title="Contract Addresses">
      <div className="form-control w-full ">
        <label className="label">
          <span className="label-text">MyToken</span>
        </label>

        <AddressInput
          onChange={newVal => onChange({ ...value, myToken: newVal })}
          value={value.myToken}
          placeholder="MyToken Address"
        />

        <label className="label pt-3">
          <span className="label-text">Ballot</span>
        </label>
        <AddressInput
          onChange={newVal => onChange({ ...value, ballot: newVal })}
          value={value.ballot}
          placeholder="Ballot Address"
        />
      </div>
    </Card>
  );
};

type Proposal = [`0x${string}`, bigint];

const InfoSection: React.FC<{ addresses: ContractAddresses }> = ({ addresses }) => {
  const { address } = useAccount();

  // read Snapshot blocknumber
  const {
    data: snapshotData,
    isError: isErrorSnapshotData,
    isLoading: isLoadingSnapshotData,
  } = useContractRead({
    address: addresses.ballot as `0x${string}`,
    abi: ballotAbi,
    functionName: "targetBlockNumber",
  });

  // read Voting Power Total
  const {
    data: votePowerTotal,
    isError: isErrorVotePowerTotal,
    isLoading: isLoadingVotePowerTotal,
  } = useContractRead({
    address: addresses.myToken as `0x${string}`,
    abi: myTokenAbi,
    functionName: "getPastVotes",
    args: [address, snapshotData],
  });

  // read Voting Power Spent
  const {
    data: votePowerSpent,
    isError: isErrorVotePowerSpent,
    isLoading: isLoadingVotePowerSpent,
  } = useContractRead({
    address: addresses.ballot as `0x${string}`,
    abi: ballotAbi,
    functionName: "votePowerSpent",
    args: [address],
  });

  // read 3 propsals
  const proposalFetches = [0, 1, 2].map(index =>
    useContractRead({
      address: addresses.ballot as `0x${string}`,
      abi: ballotAbi,
      functionName: "proposals",
      args: [index],
    }),
  );

  const proposals = proposalFetches.map((fetch, index) => {
    const data = fetch.data as Proposal;
    const proposalName = data ? hexToString(data[0], { size: 32 }) : "";
    const voteCount = data ? data[1].toString() : "0";
    return { index, proposalName, voteCount };
  });

  // read winning proposal
  const {
    data: winningProposal,
    isError: isErrorWinningProposal,
    isLoading: isLoadingWinningProposal,
  } = useContractRead({
    address: addresses.ballot as `0x${string}`,
    abi: ballotAbi,
    functionName: "winnerName",
  });

  if (!address || !addresses.ballot || !addresses.myToken)
    return (
      <Card title="Info">
        <p>Invalid Addresses</p>
      </Card>
    );

  if (isLoadingSnapshotData || isLoadingVotePowerTotal || isLoadingVotePowerSpent || isLoadingWinningProposal)
    return (
      <Card title="Info">
        <p>Loading...</p>
      </Card>
    );

  return (
    <Card title="Info">
      <div className="flex flex-col gap-3">
        {!isErrorSnapshotData ? (
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">Snapshot Block Number </span>
            <span className="text-right">{(snapshotData as bigint).toString()}</span>
          </div>
        ) : (
          <span>Error fetching snapshot block number</span>
        )}

        {!isErrorVotePowerTotal ? (
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">Total Voting Power</span>
            <span>{(votePowerTotal as bigint).toString()}</span>
          </div>
        ) : (
          <span>Error fetching total vote power</span>
        )}

        {!isErrorVotePowerTotal ? (
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">Spent Voting Power</span>
            <span>{(votePowerSpent as bigint).toString()}</span>
          </div>
        ) : (
          <span>Error fetching spent vote power</span>
        )}

        {!isErrorWinningProposal ? (
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">Winning Proposal</span>
            <span>{hexToString(winningProposal as `0x${string}`, { size: 32 })}</span>
          </div>
        ) : (
          <span>Error fetching winning proposal</span>
        )}

        {/* Display proposals */}

        <div className="flex flex-col gap-2">
          <span className="font-semibold">Proposals</span>
          {proposals.map((proposal, index) => (
            <div key={index} className="flex justify-between">
              <span>{proposal.index}</span>
              <span>{proposal.proposalName}</span>
              <span>Votes: {proposal.voteCount}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

const InteractionSection: React.FC<{ addresses: ContractAddresses }> = ({ addresses }) => {
  // add mint token

  return (
    <Card title="Interactions">
      <div className="flex flex-col gap-10">
        <Delegate myTokenAddress={addresses.myToken} />
        <Vote ballotAddress={addresses.ballot} />
        <Mint />
      </div>
    </Card>
  );
};

// Delegate Voting Power to yourself or another address
const Delegate: React.FC<{ myTokenAddress: string }> = ({ myTokenAddress }) => {
  const [delegatee, setDelegatee] = useState<string>("");

  const { data, isError, error, isLoading, isSuccess, write } = useContractWrite({
    address: myTokenAddress as `0x${string}`,
    abi: myTokenAbi,
    functionName: "delegate",
    args: [delegatee as `0x${string}`],
  });

  let statusMessage = "";
  if (isLoading) statusMessage = "Loading...";
  else if (isError) statusMessage = `Error: ${error?.message}`;
  else if (isSuccess) statusMessage = `Success: ${JSON.stringify(data)}`;

  return (
    <div className="flex flex-col gap-2 items-stretch">
      <span className="text-sm font-semibold">Delegate Voting Power</span>
      <AddressInput disabled={isLoading} onChange={setDelegatee} value={delegatee} placeholder="Delegatee Address" />
      <button disabled={isLoading} onClick={() => write()} className="btn w-48 self-center">
        Delegate
      </button>
      <span className="text-wrap">{statusMessage}</span>
    </div>
  );
};

// React Functional Component for Voting in a Ballot
const Vote: React.FC<{ ballotAddress: string }> = ({ ballotAddress }) => {
  // State for storing the proposal index entered by the user
  const [proposalIndex, setProposalIndex] = useState<string>("");
  // State for storing the amount of votes (or tokens) the user wishes to cast
  const [amount, setAmount] = useState<string>("");

  // Hook to write data to the blockchain, configured for voting
  const { data, isError, error, isLoading, isSuccess, write } = useContractWrite({
    address: ballotAddress as `0x${string}`,  // Blockchain address of the ballot contract
    abi: ballotAbi,  // ABI (Application Binary Interface) of the ballot contract
    functionName: "vote",  // Name of the function to be called
    args: [proposalIndex, amount],  // Arguments passed to the smart contract function: proposal index and vote amount
  });

  // Variable to store status messages based on the transaction state
  let statusMessage = "";
  if (isLoading) statusMessage = "Loading...";  // Display loading message during transaction processing
  else if (isError) statusMessage = `Error: ${error?.message}`;  // Display error message if the transaction fails
  else if (isSuccess) statusMessage = `Success: ${JSON.stringify(data)}`;  // Display success message and transaction data on success

  return (
    <div className="flex flex-col gap-2 items-stretch">
      <span className="text-sm font-semibold">Proposal index</span>
      {/* Input for the proposal index */}
      <IntegerInput
        name="proposalIndexInput"
        placeholder="Proposal Index"
        value={proposalIndex}
        onChange={newVal => setProposalIndex(newVal.toString())}  // Update state when input changes
        disabled={isLoading}  // Disable input while transaction is in process
        disableMultiplyBy1e18  // Disable automatic multiplication by 10^18 (common in Ethereum for converting to Wei)
      />
      <span className="text-sm font-semibold">Amount of tokens to utilize for this vote</span>
      {/* Input for the amount of votes */}
      <IntegerInput
        name="voteAmountInput"
        placeholder="Vote Amount"
        value={amount}
        onChange={newVal => setAmount(newVal.toString())}  // Update state when input changes
        disabled={isLoading}  // Disable input while transaction is in process
        disableMultiplyBy1e18  // Disable automatic multiplication by 10^18
      />
      {/* Button to submit the vote */}
      <button
        disabled={isLoading || !proposalIndex || !amount}  // Disable button if inputs are empty or transaction is loading
        onClick={() => write()}  // Call the write function to execute the smart contract function
        className="btn w-48 self-center"
      >
        Vote
      </button>
      <span className="text-wrap">{statusMessage}</span>
    </div>
  );
};

// Mint 50 tokens to a specified address
const Mint: React.FC = () => {
  // State hook for storing the recipient's Ethereum address
  const [recipient, setRecipient] = useState<string>("");
  // State hook for managing the loading state to provide UI feedback
  const [isLoading, setIsLoading] = useState(false);
  // State hook for displaying status messages after API interactions
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Function to handle the minting operation
  const handleMint = async () => {
    // Setting the loading state to true to indicate processing
    setIsLoading(true);
    try {
      // Sending a POST request to the mint-tokens endpoint of the backend
      const res = await fetch("http://localhost:3001/mint-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Set content type header for JSON
        },
        body: JSON.stringify({ address: recipient }), // Send the recipient address in the request body
      });
      const data = await res.json(); // Parsing the JSON response from the server
      setStatusMessage(JSON.stringify(data)); // Setting the status message with the response from the server
    } catch (e) {
      setStatusMessage("Failed to mint"); // Handling errors by setting the status message to indicate failure
    } finally {
      setIsLoading(false); // Resetting the loading state regardless of the outcome
    }
  };

  return (
    <div className="flex flex-col gap-2 items-stretch">
      <span className="text-sm font-semibold">Mint Voting Tokens</span>
      <AddressInput
        disabled={isLoading} // Disabling the input while loading to prevent multiple submissions
        onChange={setRecipient} // Update the recipient address as the user types
        value={recipient} // Displaying the current value of the recipient address
        placeholder="Recipient Address" // Placeholder text for the input field
      />
      <button
        disabled={isLoading || !recipient} // Disabling the button if loading or if the recipient address is not provided
        onClick={handleMint} // Setting the click handler to the mint function
        className="btn w-48 self-center"
      >
        Mint
      </button>
      <span className="text-wrap">{statusMessage}</span>
    </div>
  );
};


function WalletInfo() {
  const { address, isConnecting, isDisconnected } = useAccount();
  const { chain } = useNetwork();
  if (address)
    return (
      <div>
        {/* <WalletAction></WalletAction> */}
        {/* <WalletBalance address={address as `0x${string}`}></WalletBalance> */}
        {/* <TokenInfo address={address as `0x${string}`}></TokenInfo> */}
        {/* <ApiData address={address as `0x${string}`}></ApiData> */}
      </div>
    );
  if (isConnecting)
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  if (isDisconnected)
    return (
      <div>
        <p>Wallet disconnected. Connect wallet to continue</p>
      </div>
    );
  return (
    <div>
      <p>Connect wallet to continue</p>
    </div>
  );
}

function WalletAction() {
  const [signatureMessage, setSignatureMessage] = useState("");
  const { data, isError, isLoading, isSuccess, signMessage } = useSignMessage();
  return (
    <div className="card w-96 bg-primary text-primary-content mt-4">
      <div className="card-body">
        <h2 className="card-title">Testing signatures</h2>
        <div className="form-control w-full max-w-xs my-4">
          <label className="label">
            <span className="label-text">Enter the message to be signed:</span>
          </label>
          <input
            type="text"
            placeholder="Type here"
            className="input input-bordered w-full max-w-xs"
            value={signatureMessage}
            onChange={e => setSignatureMessage(e.target.value)}
          />
        </div>
        <button
          className="btn btn-active btn-neutral"
          disabled={isLoading}
          onClick={() =>
            signMessage({
              message: signatureMessage,
            })
          }
        >
          Sign message
        </button>
        {isSuccess && <div>Signature: {data}</div>}
        {isError && <div>Error signing message</div>}
      </div>
    </div>
  );
}

function WalletBalance(params: { address: `0x${string}` }) {
  const { data, isError, isLoading } = useBalance({
    address: params.address,
  });

  if (isLoading) return <div>Fetching balance…</div>;
  if (isError) return <div>Error fetching balance</div>;
  return (
    <div className="card w-96 bg-primary text-primary-content mt-4">
      <div className="card-body">
        <h2 className="card-title">Testing useBalance wagmi hook</h2>
        Balance: {data?.formatted} {data?.symbol}
      </div>
    </div>
  );
}

function TokenInfo(params: { address: `0x${string}` }) {
  return (
    <div className="card w-96 bg-primary text-primary-content mt-4">
      <div className="card-body">
        <h2 className="card-title">Testing useContractRead wagmi hook</h2>
        <TokenName></TokenName>
        <TokenBalance address={params.address}></TokenBalance>
      </div>
    </div>
  );
}

function TokenName() {
  const { data, isError, isLoading } = useContractRead({
    address: "0x37dBD10E7994AAcF6132cac7d33bcA899bd2C660",
    abi: [
      {
        constant: true,
        inputs: [],
        name: "name",
        outputs: [
          {
            name: "",
            type: "string",
          },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "name",
  });

  const name = typeof data === "string" ? data : 0;

  if (isLoading) return <div>Fetching name…</div>;
  if (isError) return <div>Error fetching name</div>;
  return <div>Token name: {name}</div>;
}

function TokenBalance(params: { address: `0x${string}` }) {
  const { data, isError, isLoading } = useContractRead({
    address: "0x37dBD10E7994AAcF6132cac7d33bcA899bd2C660",
    abi: [
      {
        constant: true,
        inputs: [
          {
            name: "_owner",
            type: "address",
          },
        ],
        name: "balanceOf",
        outputs: [
          {
            name: "balance",
            type: "uint256",
          },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "balanceOf",
    args: [params.address],
  });

  const balance = typeof data === "number" ? data : 0;

  if (isLoading) return <div>Fetching balance…</div>;
  if (isError) return <div>Error fetching balance</div>;
  return <div>Balance: {balance}</div>;
}

function ApiData(params: { address: `0x${string}` }) {
  return (
    <div className="card w-96 bg-primary text-primary-content mt-4">
      <div className="card-body">
        <h2 className="card-title">Testing API Coupling</h2>
        <TokenAddressFromApi></TokenAddressFromApi>
        <RequestTokens address={params.address}></RequestTokens>
      </div>
    </div>
  );
}

function TokenAddressFromApi() {
  const [data, setData] = useState<{ result: string }>();
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3001/contract-address")
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (isLoading) return <p>Loading token address from API...</p>;
  if (!data) return <p>No token address information</p>;

  return (
    <div>
      <p>Token address from API: {data.result}</p>
    </div>
  );
}

function RequestTokens(params: { address: string }) {
  const [data, setData] = useState<{ result: boolean }>();
  const [isLoading, setLoading] = useState(false);

  const body = { address: params.address };

  if (isLoading) return <p>Requesting tokens from API...</p>;
  if (!data)
    return (
      <button
        className="btn btn-active btn-neutral"
        onClick={() => {
          setLoading(true);
          fetch("http://localhost:3001/mint-tokens", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
            .then(res => res.json())
            .then(data => {
              setData(data);
              setLoading(false);
            });
        }}
      >
        Request tokens
      </button>
    );

  return (
    <div>
      <p>Result from API: {data.result ? "worked" : "failed"}</p>
    </div>
  );
}

const myTokenAbi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AccessControlBadConfirmation",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "neededRole",
        type: "bytes32",
      },
    ],
    name: "AccessControlUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [],
    name: "CheckpointUnorderedInsertion",
    type: "error",
  },
  {
    inputs: [],
    name: "ECDSAInvalidSignature",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "length",
        type: "uint256",
      },
    ],
    name: "ECDSAInvalidSignatureLength",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "ECDSAInvalidSignatureS",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "increasedSupply",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "cap",
        type: "uint256",
      },
    ],
    name: "ERC20ExceededSafeSupply",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "allowance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "needed",
        type: "uint256",
      },
    ],
    name: "ERC20InsufficientAllowance",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "needed",
        type: "uint256",
      },
    ],
    name: "ERC20InsufficientBalance",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "approver",
        type: "address",
      },
    ],
    name: "ERC20InvalidApprover",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "ERC20InvalidReceiver",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "ERC20InvalidSender",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "ERC20InvalidSpender",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
    ],
    name: "ERC2612ExpiredSignature",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "signer",
        type: "address",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "ERC2612InvalidSigner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "timepoint",
        type: "uint256",
      },
      {
        internalType: "uint48",
        name: "clock",
        type: "uint48",
      },
    ],
    name: "ERC5805FutureLookup",
    type: "error",
  },
  {
    inputs: [],
    name: "ERC6372InconsistentClock",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "currentNonce",
        type: "uint256",
      },
    ],
    name: "InvalidAccountNonce",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidShortString",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "bits",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "SafeCastOverflowedUintDowncast",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "str",
        type: "string",
      },
    ],
    name: "StringTooLong",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "expiry",
        type: "uint256",
      },
    ],
    name: "VotesExpiredSignature",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "delegator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "fromDelegate",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "toDelegate",
        type: "address",
      },
    ],
    name: "DelegateChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "delegate",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "previousVotes",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newVotes",
        type: "uint256",
      },
    ],
    name: "DelegateVotesChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "EIP712DomainChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [],
    name: "CLOCK_MODE",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MINTER_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint32",
        name: "pos",
        type: "uint32",
      },
    ],
    name: "checkpoints",
    outputs: [
      {
        components: [
          {
            internalType: "uint48",
            name: "_key",
            type: "uint48",
          },
          {
            internalType: "uint208",
            name: "_value",
            type: "uint208",
          },
        ],
        internalType: "struct Checkpoints.Checkpoint208",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "clock",
    outputs: [
      {
        internalType: "uint48",
        name: "",
        type: "uint48",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "delegatee",
        type: "address",
      },
    ],
    name: "delegate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "delegatee",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expiry",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "delegateBySig",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "delegates",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "eip712Domain",
    outputs: [
      {
        internalType: "bytes1",
        name: "fields",
        type: "bytes1",
      },
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "version",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "chainId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "verifyingContract",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "salt",
        type: "bytes32",
      },
      {
        internalType: "uint256[]",
        name: "extensions",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "timepoint",
        type: "uint256",
      },
    ],
    name: "getPastTotalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "timepoint",
        type: "uint256",
      },
    ],
    name: "getPastVotes",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
    ],
    name: "getRoleAdmin",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "targetBlockNumber",
        type: "uint256",
      },
    ],
    name: "getTokenBalanceAtBlock",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "getVotes",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "hasRole",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "nonces",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "numCheckpoints",
    outputs: [
      {
        internalType: "uint32",
        name: "",
        type: "uint32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "permit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "callerConfirmation",
        type: "address",
      },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const ballotAbi = [
  {
    inputs: [
      {
        internalType: "bytes32[]",
        name: "_proposalNames",
        type: "bytes32[]",
      },
      {
        internalType: "address",
        name: "_tokenContract",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_targetBlockNumber",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "voter",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "proposalIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "VoteCast",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "proposals",
    outputs: [
      {
        internalType: "bytes32",
        name: "name",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "voteCount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "targetBlockNumber",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "tokenContract",
    outputs: [
      {
        internalType: "contract IMyToken",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "proposal",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "vote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "votePowerSpent",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "winnerName",
    outputs: [
      {
        internalType: "bytes32",
        name: "winnerName_",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "winningProposal",
    outputs: [
      {
        internalType: "uint256",
        name: "winningProposal_",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export default Home;
