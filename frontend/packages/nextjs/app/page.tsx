"use client";

import { ReactNode, useEffect, useState } from "react";
import type { NextPage } from "next";
import { useAccount, useBalance, useContractRead, useNetwork, useSignMessage } from "wagmi";
import { Address, AddressInput } from "~~/components/scaffold-eth";

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
          <InfoSection address={contractAddresses.myToken} />
        </div>
        <WalletInfo></WalletInfo>
      </div>
    </>
  );
};

const Card: React.FC<{ children: ReactNode; title: string }> = ({ children, title }) => {
  return (
    <div className="card w-96 bg-primary text-primary-content mt-4">
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
      <div className="form-control w-full max-w-xs ">
        <label className="label">
          <span className="label-text">MyToken</span>
        </label>

        <AddressInput
          onChange={newVal => onChange({ ...value, myToken: newVal })}
          value={value.myToken}
          placeholder="MyToken Address"
        />

        <label className="label pt-5">
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

const InfoSection: React.FC<{ addresses: ContractAddresses }> = ({ addresses }) => {
  // read Voting Power
  // read winning proposal
  return <Card title="Info">Info</Card>;
};

const InteractionSection: React.FC<{ addresses: ContractAddresses }> = ({ addresses }) => {
  // add deploy MyToken
  // add deploy Ballot
  // add delegate
  // add mint token
  // add vote

  return <Card title="Interaction">Soon you can interact here</Card>;
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

export default Home;
