import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { extractApiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (trimmedName.length < 2) {
      setError("Full name must be at least 2 characters.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await register(trimmedName, trimmedEmail, password);
      navigate("/review", { replace: true });
    } catch (err) {
      setError(
        extractApiErrorMessage(
          err,
          "Unable to create account. Please try again."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b14] text-[#f5f7ff] flex flex-col justify-between p-4 md:p-8">
      <div className="max-w-[1200px] w-full mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="text-lg font-bold tracking-tight text-[#f5f7ff] inline-flex items-center gap-2 hover:opacity-85 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4 text-[#929bb0]" />
          <span>CodeSense AI</span>
        </Link>
        <Link
          to="/login"
          className="text-xs font-mono-tech text-[#929bb0] hover:text-[#f5f7ff] transition-colors"
        >
          Already registered? Sign In
        </Link>
      </div>

      <main className="w-full max-w-md mx-auto my-10">
        <div className="rounded-2xl bg-[#101522] border border-white/10 p-7 md:p-8 shadow-[0_28px_70px_-24px_rgba(139,92,246,0.22)]">
          <div className="space-y-2 pb-6 border-b border-white/8">
            <p className="font-mono-tech text-xs text-[#8b5cf6]">
              Create Account
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              Start reviewing with AI
            </h1>
            <p className="text-sm text-[#929bb0]">
              Set up your developer account to run code reviews and save your
              history.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {error && (
              <div
                role="alert"
                className="rounded-lg bg-[#ff5b65]/10 border border-[#ff5b65]/35 px-4 py-3 text-sm text-[#ff8b92]"
              >
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="reg-name"
                className="block text-xs font-medium text-[#929bb0]"
              >
                Full name
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full rounded-lg bg-[#080b14] border border-white/12 px-3.5 py-2.5 text-sm text-[#f5f7ff] placeholder:text-[#929bb0]/45 focus:outline-none focus:border-[#4f8cff] transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-email"
                className="block text-xs font-medium text-[#929bb0]"
              >
                Email address
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full rounded-lg bg-[#080b14] border border-white/12 px-3.5 py-2.5 text-sm text-[#f5f7ff] placeholder:text-[#929bb0]/45 focus:outline-none focus:border-[#4f8cff] transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-password"
                className="block text-xs font-medium text-[#929bb0]"
              >
                Password (min. 8 characters)
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-lg bg-[#080b14] border border-white/12 px-3.5 py-2.5 text-sm text-[#f5f7ff] placeholder:text-[#929bb0]/45 focus:outline-none focus:border-[#4f8cff] transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-confirm"
                className="block text-xs font-medium text-[#929bb0]"
              >
                Confirm password
              </label>
              <input
                id="reg-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full rounded-lg bg-[#080b14] border border-white/12 px-3.5 py-2.5 text-sm text-[#f5f7ff] placeholder:text-[#929bb0]/45 focus:outline-none focus:border-[#4f8cff] transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#4f8cff] to-[#8b5cf6] hover:opacity-95 disabled:opacity-60 text-sm font-semibold text-white transition-opacity inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{submitting ? "Creating account..." : "Create Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#929bb0]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#4f8cff] hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>

      <div className="text-center font-mono-tech text-xs text-[#929bb0]/60">
        CodeSense AI · Think Smarter. Code Better.
      </div>
    </div>
  );
}
