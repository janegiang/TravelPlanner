import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [GitHub],
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database", // or "jwt" depending on your setup
    maxAge: 24 * 60 * 60, // 1 day in seconds (86400 seconds)
  },
});
