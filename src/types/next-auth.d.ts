import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      familyId: string;
      familyName: string;
      isPrimary: boolean;
    };
  }

  interface User {
    familyId?: string;
    familyName?: string;
    isPrimary?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    familyId?: string;
    familyName?: string;
    isPrimary?: boolean;
  }
}
