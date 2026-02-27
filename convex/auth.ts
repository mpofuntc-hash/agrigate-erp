import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";
import Apple from "@auth/core/providers/apple";
import MicrosoftEntraId from "@auth/core/providers/microsoft-entra-id";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Google({
      clientId:     process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Apple({
      clientId:     process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET,
    }),
    MicrosoftEntraId({
      clientId:     process.env.AUTH_MICROSOFT_ID,
      clientSecret: process.env.AUTH_MICROSOFT_SECRET,
    }),
  ],
});
