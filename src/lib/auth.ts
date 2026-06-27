import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import {
  ACCESS_DENIED_ERROR_CODE,
  ACCESS_DENIED_MESSAGE,
} from "@/lib/auth-access";

class AccessDeniedError extends Error {
  constructor() {
    super(ACCESS_DENIED_MESSAGE);
    this.name = ACCESS_DENIED_ERROR_CODE;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { family: true },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!valid) return null;

        if (!user.isApproved) {
          throw new AccessDeniedError();
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          familyId: user.familyId,
          familyName: user.family.name,
          isPrimary: user.isPrimary,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.familyId = (user as { familyId?: string }).familyId;
        token.familyName = (user as { familyName?: string }).familyName;
        token.isPrimary = (user as { isPrimary?: boolean }).isPrimary ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isPrimary: true, isApproved: true },
        });

        if (!dbUser?.isApproved) {
          return session;
        }

        session.user.id = token.id as string;
        session.user.familyId = token.familyId as string;
        session.user.familyName = token.familyName as string;
        session.user.isPrimary = dbUser.isPrimary;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});
