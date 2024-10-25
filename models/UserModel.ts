import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

// Définition de l'interface User qui étend Document pour Mongoose
export interface IUser extends Document {
  token: any;
  _id: string;
  name: string;
  email: string;
  password: string;
  role: string; // Ajoute les rôles, par exemple : "user" | "admin"
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
    password: {
      type: String,
      required: true,
    },
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
