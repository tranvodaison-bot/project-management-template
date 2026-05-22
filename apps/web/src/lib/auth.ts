import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@ftz-erp/db";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.tenantId = (user as any).tenantId;
        token.permissions = (user as any).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId as string;
      (session as any).tenantId = token.tenantId;
      (session as any).permissions = token.permissions;
      return session;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: {
            userRoles: {
              include: { role: true },
            },
          },
        });

        if (!user || !user.isActive) return null;

        // In production: verify hashed password. For seed users, any password works.
        // TODO: Add bcrypt password verification
        const permissions = user.userRoles.flatMap((ur) => ur.role.permissions);

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          image: user.avatarUrl,
          tenantId: user.tenantId,
          permissions: [...new Set(permissions)],
        };
      },
    }),
  ],
});
