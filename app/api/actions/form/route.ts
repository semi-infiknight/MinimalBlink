import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const ACTION_URL = "https://chess.spawnpoint.cloud/api/actions/form";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Allow-Credentials": "true",
};

export async function GET(req: NextRequest) {
  try {
    const payload = {
      icon: `https://blue-magnetic-wallaby-228.mypinata.cloud/ipfs/QmWqVwNn2REZ5rUV848LtcNiSFsLZq17fvbn7C9wd6hFga`,
      label: "Donate",
      title: "Minmal Eth Blink",
      description: "Donate ETH",
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

    // Check if window.ethereum is available
    if (typeof window === "undefined" || !window.ethereum) {
      return new NextResponse('Ethereum provider is not available', { status: 400, headers: CORS_HEADERS });
    }

    // Set provider with browser
    console.log('setActiveProviderDetailWindowEthereum ', window.ethereum);

    const providerDetail = {
      info: {
        uuid: '',
        name: 'window.ethereum',
        icon: '',
      },
      provider: window.ethereum,
    };

    const provider = providerDetail.provider;

    if (!ethers.utils.isAddress(account)) {
      return new NextResponse('Invalid account provided', { status: 400, headers: CORS_HEADERS });
    }

    if (!amount) {
      return new NextResponse('Amount is required', { status: 400, headers: CORS_HEADERS });
    }

    // Transaction parameters
    const params = {
      to: account,
      value: ethers.utils.parseEther(amount),
      data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(note)),
    };

    // Send transaction using window.ethereum provider
    const result = await provider.request({
      method: 'eth_sendTransaction',
      params: [params],
    });

    const payload = {
      transaction: result,
      message: "Thank you for your donation!",
    };

    return NextResponse.json(payload, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("Error handling POST request:", error);
    return NextResponse.json({ message: "An unknown error occurred" }, { status: 500, headers: CORS_HEADERS });
  }
}
