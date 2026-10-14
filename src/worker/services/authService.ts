import { Database } from "../db/queries";
import { SignupConsent, User } from "../types";
import { hashPassword, verifyPassword, needsRehash } from "../utils/hash";
import { generateJWT } from "../utils/jwt";
import { generateId } from "../utils/id";
import { ConflictError, ValidationError } from "../utils/errors";

export class AuthService {
  constructor(private db: Database, private jwtSecret: string) {}

  async register(
    email: string,
    password: string,
    name: string,
    citizenship?: string,
    residency?: string,
    consent?: SignupConsent
  ): Promise<{ user: User; token: string }> {
    // Validate input
    if (!email || !password) {
      throw new ValidationError("Email and password are required");
    }

    // Legal trust boundary: no account without explicit terms + privacy consent.
    // Enforced server-side so a client that skips the checkbox cannot register.
    if (!consent || consent.acceptedTerms !== true || consent.acceptedPrivacy !== true) {
      throw new ValidationError("You must accept the Terms of Service and Privacy Policy");
    }

    // Check if user exists
    const existing = await this.db.queryOne<User>("SELECT * FROM users WHERE email = ?", [email]);
    if (existing) {
      throw new ConflictError("User already exists");
    }

    const userId = generateId();
    const passwordHash = await hashPassword(password);

    await this.db.execute(
      "INSERT INTO users (id, email, password_hash, name, citizenship, residency, itin_status, terms_version, privacy_version, consent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        userId,
        email,
        passwordHash,
        name || null,
        citizenship || null,
        residency || null,
        "not_started",
        consent.termsVersion || null,
        consent.privacyVersion || null,
        consent.timestamp || new Date().toISOString(),
      ]
    );

    const user = await this.db.queryOne<User>("SELECT * FROM users WHERE id = ?", [userId]);
    const token = await generateJWT(userId, email, this.jwtSecret);

    return { user: user!, token };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = await this.db.queryOne<User>("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) {
      // Same message as a bad password: do not reveal whether the email exists.
      throw new ValidationError("Invalid email or password");
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new ValidationError("Invalid email or password");
    }

    // Transparent migration: upgrade legacy SHA-256 hashes to PBKDF2 on login.
    if (needsRehash(user.password_hash)) {
      const upgraded = await hashPassword(password);
      await this.db.execute("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", [
        upgraded,
        new Date().toISOString(),
        user.id,
      ]);
    }

    const token = await generateJWT(user.id, user.email, this.jwtSecret);
    return { user, token };
  }

  async getUser(userId: string): Promise<User | null> {
    return this.db.queryOne<User>("SELECT * FROM users WHERE id = ?", [userId]);
  }
}
