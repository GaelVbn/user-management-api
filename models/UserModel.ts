import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

// Définition de l'interface User qui étend Document pour Mongoose
export interface IUser extends Document {
  token: any;
  _id: string;
  name: string;
  email: string;
  newEmail: string | null;
  newEmailToken: string | null;
  newEmailVerified: boolean;
  newEmailTokenExpires: Date | null;
  password: string;
  role: string; // Ajoute les rôles, par exemple : "user" | "admin"
  isVerified: boolean;
  mailToken: string | null;
  tokenVersion: number;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
}

const userSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    newEmail: {
      type: String,
    },
    newEmailToken: {
      type: String,
    },
    newEmailVerified: {
      type: Boolean,
      default: false,
    },
    newEmailTokenExpires: { type: Date },
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    mailToken: {
      type: String,
      default: null,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

// Middleware pour hacher le mot de passe avant de le sauvegarder
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Méthode pour comparer les mots de passe
export const matchPassword = async (
  user: any,
  enteredPassword: string
): Promise<boolean> => {
  return bcrypt.compare(enteredPassword, user.password);
};

const User = mongoose.model<IUser>("User", userSchema);

export default User;
