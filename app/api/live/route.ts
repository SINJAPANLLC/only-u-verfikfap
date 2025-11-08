import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const { minutes, rate, streamerAccountId, agencyAccountId } = await req.json();
  const base = minutes * rate;
  const total = Math.floor(base * 1.1);
  const platformFee = Math.floor(base * 0.2);
  const agencyFee = Math.floor(base * 0.2);

  const intent = await stripe.paymentIntents.create({
    amount: total,
    currency: "jpy",
    application_fee_amount: platformFee + agencyFee,
    transfer_data: { destination: streamerAccountId },
    metadata: { type: "live", minutes, rate, agencyAccountId }
  });

  return Response.json({ client_secret: intent.client_secret });
}
