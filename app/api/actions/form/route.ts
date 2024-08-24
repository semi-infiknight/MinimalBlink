import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const ACTION_URL = "https://37a3d4e1f4a8bb.lhr.life/api/actions/form";

// Common CORS headers
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", 
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Allow-Credentials": "true",
};


export async function GET(req: NextRequest) {
  try {
    const payload = {
      icon: `https://example.com/donation-icon.png`,
      label: "Donate",
      title: "Support Alice's Research",
      description: "Donate ETH to support Alice's cybersecurity research.",
      disabled: false,
      links: {
        actions: [
          {
            href: `${ACTION_URL}?amount={amount}&note={note}`,
            label: "Donate",
            parameters: [
              {
                name: "amount",
                label: "Enter the amount of ETH to donate",
                required: true,
              },
              {
                name: "note",
                label: "Leave a thank you note (optional)",
                required: false,
              },
            ],
          },
        ],
      },
    };

    return NextResponse.json(payload, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("Error handling GET request:", error);
    return NextResponse.json({ message: "An error occurred during GET request" }, { status: 500 });
  }
}


export async function OPTIONS(req: NextRequest) {
  console.log("Handling OPTIONS preflight request");
  return NextResponse.json(null, { headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const account = body.account;
    const amount = req.nextUrl.searchParams.get('amount');
    const note = req.nextUrl.searchParams.get('note') || '';

    if (!ethers.utils.isAddress(account)) {
      return new NextResponse('Invalid account provided', { status: 400, headers: CORS_HEADERS });
    }

    if (!amount) {
      return new NextResponse('Amount is required', { status: 400, headers: CORS_HEADERS });
    }

    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const RPC_URL = process.env.RPC_URL;

    if (!PRIVATE_KEY || !RPC_URL) {
      throw new Error('Private key or RPC URL is missing in the environment variables');
    }

    // Connect to Ethereum network
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    // Create and send the transaction
    const tx = {
      to: account,
      value: ethers.utils.parseEther(amount),
      data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(note)),  // Optional note added to the transaction
    };

    const transactionResponse = await signer.sendTransaction(tx);

    // Create response payload
    const payload = {
      transaction: transactionResponse.hash,
      message: "Thank you for your donation!",
    };

    return NextResponse.json(payload, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("Error handling POST request:", error);
    return NextResponse.json({ message: "An unknown error occurred" }, { status: 500, headers: CORS_HEADERS });
  }
}
