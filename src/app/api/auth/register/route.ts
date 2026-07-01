import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, familyName, inviteCode } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    let familyId: string;
    let joinedFamilyName: string;
    let familyInviteCode: string;

    if (inviteCode) {
      const family = await prisma.family.findUnique({
        where: { inviteCode: inviteCode.toUpperCase() },
      });
      if (!family) {
        return NextResponse.json(
          { error: "Invalid family invite code" },
          { status: 400 }
        );
      }
      familyId = family.id;
      joinedFamilyName = family.name;
      familyInviteCode = family.inviteCode;
    } else {
      if (!familyName) {
        return NextResponse.json(
          { error: "Family name is required when creating a new family" },
          { status: 400 }
        );
      }
      const code = generateInviteCode();
      const family = await prisma.family.create({
        data: { name: familyName, inviteCode: code },
      });
      familyId = family.id;
      joinedFamilyName = family.name;
      familyInviteCode = family.inviteCode;
    }

    const isCreatingFamily = !inviteCode;

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        familyId,
        isPrimary: isCreatingFamily,
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      familyName: joinedFamilyName,
      inviteCode: familyInviteCode,
    });
  } catch (error) {
    console.error("Register error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create account";

    const isTableMissing =
      message.includes("does not exist") ||
      message.includes("P2021") ||
      message.includes("relation");

    return NextResponse.json(
      {
        error: isTableMissing
          ? "Database is not set up. Run: npx prisma db push"
          : process.env.NODE_ENV === "development"
            ? message
            : "Failed to create account",
      },
      { status: 500 }
    );
  }
}
