"use client";
import {useWallet} from "@solana/wallet-adapter-react";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
export default function WalletConnect(){const {connected,publicKey}=useWallet();return <div className="wallet-connect"><WalletMultiButton>{connected&&publicKey?publicKey.toBase58().slice(0,4)+"..."+publicKey.toBase58().slice(-4):"Connect Wallet"}</WalletMultiButton></div>}