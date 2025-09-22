import { db } from "@/db";
import { users } from "@/db/schema";
import { UserJSON } from "@clerk/nextjs/server";
import { verifyWebhook, WebhookEvent } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

function buildName(d: UserJSON): string {
  const name = [d.first_name, d.last_name].filter(Boolean).join(" ").trim();
  return name || d.username || "Unnamed";
}

export async function POST(req: NextRequest) {
  //   const secret = process.env.CLERK_SIGNIN_SECRET;
  //   if (!secret) {
  //     return new Response("Webhook secret not configured", { status: 500 });
  //   }

  //   try {
  //     const evt = await verifyWebhook(req, { signingSecret: secret });

  //     // Do something with payload
  //     // For this guide, log payload to console
  //     const data = evt.data;
  //     const eventType = evt.type;
  //     console.log(
  //       `Received webhook with ID ${data.id} and event type of ${eventType}`
  //     );

  //     console.log("Webhook payload:", data);

  //     // Handle the webhook event
  //     switch (eventType) {
  //       case "user.created":
  //         const data = evt.data;

  //         // Handle user created event
  //         await db.insert(users).values({
  //           clerkId: data.id,
  //           name: `${data.first_name} ${data.last_name}`.trim(),
  //           imageUrl: data.image_url,
  //         });
  //         break;
  //       case "user.updated":
  //         // Handle user updated event
  //         break;
  //       case "user.deleted":
  //         // Handle user deleted event
  //         break;
  //       default:
  //         console.warn(`Unhandled event type: ${eventType}`);
  //     }

  //     if (eventType === "user.deleted") {
  //       const data = evt.data;
  //       if (!data.id) {
  //         return new Response("No user ID provided", { status: 400 });
  //       }
  //       await db.delete(users).where(eq(users.clerkId, data.id));
  //     }

  //     if (eventType === "user.updated") {
  //       const data = evt.data;
  //       if (!data.id) {
  //         return new Response("No user ID provided", { status: 400 });
  //       }
  //       await db
  //         .update(users)
  //         .set({
  //           name: `${data.first_name} ${data.last_name}`.trim(),
  //           imageUrl: data.image_url,
  //         })
  //         .where(eq(users.clerkId, data.id));
  //     }

  //     return new Response("Webhook received", { status: 200 });
  //   }

  const signingSecret = process.env.CLERK_WEBHOOK_SECRET; // <-- nómbrala igual que en tu .env
  if (!signingSecret) {
    console.error("Missing CLERK_WEBHOOK_SECRET");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  let evt: WebhookEvent;

  // 2) Verificar firma
  try {
    evt = await verifyWebhook(req, { signingSecret }); // <-- aquí se usa
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Bad signature", { status: 400 });
  }

  const { type: eventType, data } = evt;
  console.log(`[Clerk] ${eventType} id=${(data as UserJSON)?.id}`);

  // 3) Manejo idempotente de eventos
  try {
    switch (eventType) {
      case "user.created": {
        console.log("[Clerk] Creating user in DB");
        const d = data as UserJSON;
        await db
          .insert(users)
          .values({
            clerkId: d.id,
            name: buildName(d),
            imageUrl: d.image_url ?? null,
          })
          .onConflictDoUpdate({
            target: users.clerkId,
            set: {
              name: buildName(d),
              imageUrl: d.image_url ?? null,
            },
          });
        break;
      }

      case "user.updated": {
        const d = data as UserJSON;
        if (!d?.id) return new Response("Missing user id", { status: 400 });

        await db
          .update(users)
          .set({
            name: buildName(d),
            imageUrl: d.image_url ?? null,
          })
          .where(eq(users.clerkId, d.id));
        break;
      }

      case "user.deleted": {
        const d = data;
        if (!d?.id) return new Response("Missing user id", { status: 400 });
        await db.delete(users).where(eq(users.clerkId, d.id));
        break;
      }
      default: {
        console.warn(`[Clerk] Unhandled event type: ${eventType}`);
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }
}
