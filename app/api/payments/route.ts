import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const { type, amount, creatorAccountId } = await req.json();
  const buyerFee = Math.floor(amount * 0.1);
  const tax = Math.floor(amount * 0.1);
  const total = amount + buyerFee + tax;
  const creatorDeduct = Math.floor(amount * 0.15);

  const intent = await stripe.paymentIntents.create({
    amount: total,
    currency: "jpy",
    application_fee_amount: creatorDeduct,
    transfer_data: { destination: creatorAccountId },
    metadata: { type }
  });

  return Response.json({ client_secret: intent.client_secret });
}
