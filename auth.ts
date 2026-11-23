import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/** Google sign-in. Sessions are signed cookies (JWT), so no database is needed. */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 90 },
  trustHost: true,
  pages: { error: "/signin" },
  callbacks: {
    jwt({ token, profile }) {
      // Google's stable account id identifies the user across devices.
      if (profile?.sub) token.sub = profile.sub;
      return token;
    },
    session({ session, token }) {
      if (token.sub && session.user) session.user.id = token.sub;
      return session;
    },
  },
});
