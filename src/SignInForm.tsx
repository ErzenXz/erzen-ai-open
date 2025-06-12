// components/SignInForm.tsx
"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, KeyRound, LoaderCircle, User } from "lucide-react";

// This component is now just the form card, without any background logic.
export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.target as HTMLFormElement);
    formData.set("flow", flow);

    signIn("password", formData)
      .catch((error) => {
        let toastTitle = "An error occurred";
        if (error.message.includes("Invalid password")) {
          toastTitle = "Invalid password. Please try again.";
        } else {
          toastTitle =
            flow === "signIn"
              ? "Could not sign in. Do you need to sign up?"
              : "Could not sign up. Do you already have an account?";
        }
        toast.error(toastTitle);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <div className="w-full bg-black/50 backdrop-blur-lg p-8 rounded-2xl shadow-2xl shadow-cyan-500/10">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="relative">
          <label htmlFor="email" className="sr-only">Email</label>
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            id="email"
            className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
            type="email"
            name="email"
            placeholder="Email"
            required
          />
        </div>

        <div className="relative">
          <label htmlFor="password" className="sr-only">Password</label>
          <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            id="password"
            className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
            type="password"
            name="password"
            placeholder="Password"
            required
          />
        </div>

        <button
          className="w-full flex items-center justify-center bg-cyan-500 text-black font-semibold py-3 px-4 rounded-lg hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-400 transition-colors duration-300 disabled:bg-cyan-800/50 disabled:cursor-not-allowed"
          type="submit"
          disabled={submitting}
        >
          {submitting ? (
            <LoaderCircle className="animate-spin h-6 w-6" />
          ) : (
            <span>{flow === "signIn" ? "Sign In" : "Create Account"}</span>
          )}
        </button>
      </form>

      <div className="text-center text-sm text-gray-400 mt-6">
        <span>
          {flow === "signIn"
            ? "Don't have an account? "
            : "Already have an account? "}
        </span>
        <button
          type="button"
          className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium"
          onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
        >
          {flow === "signIn" ? "Sign up" : "Sign in"}
        </button>
      </div>

      <div className="flex items-center my-6">
        <hr className="flex-grow border-t border-gray-700" />
        <span className="mx-4 text-xs font-semibold text-gray-500 uppercase">
          OR
        </span>
        <hr className="flex-grow border-t border-gray-700" />
      </div>

      <button
        className="w-full flex items-center justify-center gap-2 bg-transparent text-gray-300 font-semibold py-3 px-4 rounded-lg border border-gray-600 hover:bg-gray-800/50 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-400 transition-colors duration-300"
        onClick={() => void signIn("anonymous")}
      >
        <User className="h-5 w-5 text-gray-400" />
        <span>Continue Anonymously</span>
      </button>
    </div>
  );
}