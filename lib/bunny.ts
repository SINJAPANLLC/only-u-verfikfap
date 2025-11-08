import fetch from "cross-fetch";

const storageZone = process.env.BUNNY_STORAGE_ZONE!;
const apiKey = process.env.BUNNY_API_KEY!;
const cdn = process.env.BUNNY_CDN_PULL_ZONE_URL!;

export async function uploadBunny(path: string, data: ArrayBuffer) {
  const response = await fetch(`https://storage.bunnycdn.com/${storageZone}/${path}`, {
    method: "PUT",
    headers: {
      AccessKey: apiKey
    },
    body: Buffer.from(data)
  });

  if (!response.ok) {
    throw new Error("Bunny upload failed");
  }

  return `${cdn}/${path}`;
}
