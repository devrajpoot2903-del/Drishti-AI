import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "./db.service";

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: "INSTITUTION" | "SCRUTINY_OFFICER" | "ADMIN";
  institutionId?: string;
  institutionName?: string;
  isDemoAccount?: boolean;
}

export const DEMO_ACCOUNTS = [
  {
    id: "usr_demo_officer_01",
    email: "demo-officer@aicte.gov.in",
    legacyEmail: "officer@aicte.gov.in",
    passwordPlain: "DemoOfficer#AICTE2026!",
    name: "Dr. A. K. Sharma (Demo Officer)",
    role: "SCRUTINY_OFFICER" as const,
    designation: "Senior Scrutiny Officer (Demonstration Sandbox)",
    isDemoAccount: true
  },
  {
    id: "usr_demo_inst_01",
    email: "demo-institution@engg.edu",
    legacyEmail: "principal@engg.edu",
    passwordPlain: "DemoInst#AICTE2026!",
    name: "Apex Institute of Tech (Demo Institution)",
    role: "INSTITUTION" as const,
    institutionId: "inst_apex_demo_01",
    institutionName: "Apex Institute of Technology (Demonstration Sandbox)",
    designation: "Institutional Principal Representative",
    isDemoAccount: true
  },
  {
    id: "usr_demo_admin_01",
    email: "demo-admin@aicte.gov.in",
    legacyEmail: "admin@aicte.gov.in",
    passwordPlain: "DemoAdmin#AICTE2026!",
    name: "System Admin (Demo Administrator)",
    role: "ADMIN" as const,
    designation: "AICTE Portal Platform Administrator (Demonstration Sandbox)",
    isDemoAccount: true
  }
];

export class AuthService {
  private static initialized = false;

  public static async initSeedUsers(): Promise<void> {
    if (this.initialized) return;
    const state = db.getState();
    const existingUsers = state.users || [];

    for (const u of DEMO_ACCOUNTS) {
      const found = existingUsers.find(
        (ex: any) =>
          ex.email.toLowerCase() === u.email.toLowerCase() ||
          ex.email.toLowerCase() === u.legacyEmail.toLowerCase()
      );

      const passwordHash = await bcrypt.hash(u.passwordPlain, 10);

      if (!found) {
        db.createUser({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          passwordHash,
          institutionId: (u as any).institutionId || null,
          institutionName: (u as any).institutionName || null,
          designation: u.designation,
          isDemoAccount: true,
          createdAt: new Date().toISOString()
        });
      } else {
        // Ensure password and demo labels are updated
        found.passwordHash = passwordHash;
        found.name = u.name;
        found.isDemoAccount = true;
        found.designation = u.designation;
      }
    }
    db.saveState(state);
    this.initialized = true;
  }

  public static async authenticate(email: string, passwordPlain: string): Promise<UserSession | null> {
    await this.initSeedUsers();
    const cleanEmail = email.trim().toLowerCase();

    // Check direct email or legacy demo alias
    const state = db.getState();
    let user = state.users.find((u: any) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // Check if matches a legacy demo email
      const matchedDemo = DEMO_ACCOUNTS.find(
        (d) => d.legacyEmail.toLowerCase() === cleanEmail || d.email.toLowerCase() === cleanEmail
      );
      if (matchedDemo) {
        user = state.users.find(
          (u: any) =>
            u.email.toLowerCase() === matchedDemo.email.toLowerCase() ||
            u.email.toLowerCase() === matchedDemo.legacyEmail.toLowerCase()
        );
      }
    }

    if (!user) return null;

    const valid = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!valid) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      institutionId: user.institutionId,
      institutionName: user.institutionName,
      isDemoAccount: user.isDemoAccount ?? true
    };
  }

  public static async getUserById(id: string): Promise<UserSession | null> {
    await this.initSeedUsers();
    const user = db.findUserById(id);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      institutionId: user.institutionId,
      institutionName: user.institutionName,
      isDemoAccount: user.isDemoAccount ?? true
    };
  }
}
