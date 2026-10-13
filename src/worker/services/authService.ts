import { Database } from "../db/queries";
import { User } from "../types";
import { hashPassword, verifyPassword } from "../utils/hash";
import { generateJWT } from "../utils/jwt";
import { generateId } from "../utils/id";
import { ConflictError, ValidationError } from "../utils/errors";

export class AuthService {
  constructor(private db: Database, private jwtSecret: string) {}

  async register(email: string, password: string, name: string, citizenship?: string, residency?: string): Promise<{ user: User; token: string }> {
    // Validate input
    if (!email || !password) {
      throw new ValidationError("Email and password are required");
    }

    // Check if user exists
    const existing = await this.db.queryOne<User>("SELECT * FROM users WHERE email = ?", [email]);
    if (existing) {
      throw new ConflictError("User already exists");
    }

    const userId = generateId();
    const passwordHash = await hashPassword(password);

    await this.db.execute("INSERT INTO users (id, email, password_hash, name, citizenship, residency, itin_status) VALUES (?, ?, ?, ?, ?, ?, ?)", [
      userId,
      email,
      passwordHash,
      name || null,
      citizenship || null,
      residency || null,
      "not_started",
    ]);

    const user = await this.db.queryOne<User>("SELECT * FROM users WHERE id = ?", [userId]);
    const token = await generateJWT(userId, email, this.jwtSecret);

    return { user: user!, token };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = await this.db.queryOne<User>("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) {
      console.error("User not found:", email);
      throw new ValidationError("Invalid email or password");
    }

    console.log("User found:", email);
    console.log("Stored hash:", user.password_hash.substring(0, 20) + "...");
    
    const isValid = await verifyPassword(password, user.password_hash);
    console.log("Password verification:", isValid);
    
    if (!isValid) {
      throw new ValidationError("Invalid email or password");
    }

    const token = await generateJWT(user.id, user.email, this.jwtSecret);
    return { user, token };
  }

  async getUser(userId: string): Promise<User | null> {
    return this.db.queryOne<User>("SELECT * FROM users WHERE id = ?", [userId]);
  }
}
