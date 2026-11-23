"use client";

import React, { useState, useEffect } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Shield, AlertCircle } from "lucide-react";

interface AuthCardProps {
  initialMode?: "login" | "signup";
}

export const AuthCard: React.FC<AuthCardProps> = ({ initialMode = "login" }) => {
  // Tab State & Direction for Sliding Animation
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [direction, setDirection] = useState<number>(initialMode === "signup" ? 1 : -1);

  // Check URL query parameters on mount without triggering suspense requirement
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "signup") {
        setMode("signup");
        setDirection(1);
      } else if (tab === "login") {
        setMode("login");
        setDirection(-1);
      }
    }
  }, []);

  const switchMode = (newMode: "login" | "signup") => {
    if (newMode === mode) return;
    setDirection(newMode === "signup" ? 1 : -1);
    setMode(newMode);
    setError("");
  };

  // Clerk Hooks
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();

  // Shared Form State
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Sign-up Specific State
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle Login Submit with Hard Window Navigation to ensure cookies are sent
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignInLoaded || !signIn) return;

    setError("");
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: identifier.trim(),
        password: password,
      });

      if (result.status === "complete") {
        await setSignInActive({ session: result.createdSessionId });
        // Use full window navigation so Next.js server components receive fresh session cookies
        window.location.href = "/";
      } else {
        setError(`Additional verification step required (${result.status}). Please check your email.`);
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      const errMsg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Invalid login credentials. Please check and try again.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign-Up Submit (Saves Name + Email to profile)
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUpLoaded || !signUp) return;

    setError("");
    setLoading(true);

    try {
      const parts = fullName.trim().split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";

      const res = await signUp.create({
        firstName,
        lastName,
        emailAddress: signupEmail.trim(),
        password: signupPassword,
      });

      if (res.status === "complete") {
        await setSignUpActive({ session: res.createdSessionId });
        window.location.href = "/";
        return;
      }

      // Prepare email code verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifying(true);
    } catch (err: any) {
      console.error("Sign up error:", err);
      const errMsg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Could not create account. Please check your information.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Email Verification Submit with Hard Window Navigation
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUpLoaded || !signUp) return;

    setError("");
    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (completeSignUp.status === "complete") {
        await setSignUpActive({ session: completeSignUp.createdSessionId });
        // Use full window navigation so Next.js server components receive fresh session cookies
        window.location.href = "/";
      } else {
        setError("Verification incomplete: " + completeSignUp.status);
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      const errMsg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Invalid verification code. Please check your email.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Social OAuth Handler
  const handleOAuth = (strategy: "oauth_google" | "oauth_microsoft") => {
    const authTarget = mode === "login" ? signIn : signUp;
    if (!authTarget) return;

    try {
      authTarget.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: any) {
      console.error("OAuth error:", err);
      setError(err?.errors?.[0]?.message || "Could not initiate social authentication.");
    }
  };

  // Framer Motion Slide Variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-start sm:justify-center items-center pt-4 sm:pt-6 pb-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#e8f1ec] via-[#f4f7f5] to-[#dbe9e1] overflow-x-hidden">
      {/* Soft Botanical Ambient Background Glows */}
      <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full bg-[#c8decb]/50 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -right-28 w-96 h-96 rounded-full bg-[#b8d4bd]/40 blur-3xl pointer-events-none" />

      {/* Top Header Badge */}
      <div className="w-full max-w-4xl mb-3 flex items-center justify-between px-2 z-10">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-[#2d4a3e] flex items-center justify-center text-white shadow-sm shadow-[#2d4a3e]/30">
            <Shield className="h-4 w-4" />
          </div>
          <span className="text-sm font-extrabold text-slate-900 tracking-tight">
            ClaimKavach <span className="text-[#2d4a3e]">AI</span>
          </span>
        </div>

        <span className="text-[11px] font-bold text-[#1e3c2c] bg-white/90 backdrop-blur-sm border border-emerald-300/80 px-3 py-1 rounded-full shadow-2xs">
          🛡️ IRDAI & PM-JAY Compliance Portal
        </span>
      </div>

      {/* Main Auth Card - Shifted Upwards for High-Visibility Layout */}
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-[32px] sm:rounded-[38px] shadow-[0_20px_50px_rgba(20,40,30,0.14)] border border-white/90 overflow-hidden -mt-1 sm:-mt-2">
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[550px]">
          
          {/* ======================================================== */}
          {/* Left Column: Form Area with Sliding Transition          */}
          {/* ======================================================== */}
          <div className="md:col-span-7 p-7 sm:p-10 lg:p-12 flex flex-col justify-between bg-white relative z-10">
            <div>
              {/* Segmented Sliding Tab Control ([ Log in ] [ Sign up ]) */}
              <div className="flex items-center justify-between mb-5">
                <div className="relative flex p-1 rounded-full bg-slate-100 border border-slate-200 w-full max-w-[240px]">
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className={`relative z-10 flex-1 py-1.5 text-xs font-extrabold transition-colors cursor-pointer rounded-full ${
                      mode === "login" ? "text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {mode === "login" && (
                      <motion.div
                        layoutId="activeAuthPill"
                        className="absolute inset-0 bg-[#2d4a3e] rounded-full shadow-xs"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">Log in</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className={`relative z-10 flex-1 py-1.5 text-xs font-extrabold transition-colors cursor-pointer rounded-full ${
                      mode === "signup" ? "text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {mode === "signup" && (
                      <motion.div
                        layoutId="activeAuthPill"
                        className="absolute inset-0 bg-[#2d4a3e] rounded-full shadow-xs"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">Sign up</span>
                  </button>
                </div>

                <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                  {mode === "login" ? "Returning Member" : "New Registration"}
                </span>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <span className="leading-relaxed font-medium">{error}</span>
                </div>
              )}

              {/* Sliding Form Container */}
              <div className="overflow-hidden relative min-h-[280px]">
                <AnimatePresence mode="wait" custom={direction}>
                  {mode === "login" ? (
                    /* ================= LOGIN FORM ================= */
                    <motion.div
                      key="login"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.24, ease: "easeInOut" }}
                      className="space-y-3.5"
                    >
                      <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1 ml-1">
                            Login, email or phone number
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              value={identifier}
                              onChange={(e) => setIdentifier(e.target.value)}
                              placeholder="Enter email or phone"
                              className="w-full pl-5 pr-4 py-2.5 sm:py-3 rounded-full border border-slate-300 hover:border-slate-400 focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e]/15 outline-none text-xs sm:text-sm text-slate-800 transition-all bg-white shadow-2xs font-medium"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1 ml-1">
                            Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter password"
                              className="w-full pl-5 pr-12 py-2.5 sm:py-3 rounded-full border border-slate-300 hover:border-slate-400 focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e]/15 outline-none text-xs sm:text-sm text-slate-800 transition-all bg-white shadow-2xs font-medium"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                              title={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="pt-1.5">
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-6 rounded-full bg-[#2d4a3e] hover:bg-[#223930] active:bg-[#182922] text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-[#2d4a3e]/20 hover:shadow-lg hover:shadow-[#2d4a3e]/25 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                          >
                            {loading ? (
                              <>
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Logging in...</span>
                              </>
                            ) : (
                              <span>Log in</span>
                            )}
                          </button>
                        </div>
                      </form>

                      {/* Divider */}
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                            or log in with
                          </span>
                        </div>
                      </div>

                      {/* Social OAuth Icons */}
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleOAuth("oauth_google")}
                          className="h-10 w-13 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center shadow-2xs active:scale-95 cursor-pointer"
                          title="Sign in with Google"
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOAuth("oauth_microsoft")}
                          className="h-10 w-13 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center shadow-2xs active:scale-95 cursor-pointer"
                          title="Sign in with Microsoft"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 23 23">
                            <path fill="#f35325" d="M1 1h10v10H1z" />
                            <path fill="#81bc06" d="M12 1h10v10H12z" />
                            <path fill="#05a6f0" d="M1 12h10v10H1z" />
                            <path fill="#ffba08" d="M12 12h10v10H12z" />
                          </svg>
                        </button>
                      </div>

                      <div className="text-center pt-1">
                        <span className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer font-medium">
                          Forgot login or password?
                        </span>
                      </div>
                    </motion.div>
                  ) : verifying ? (
                    /* ================= EMAIL VERIFICATION STEP ================= */
                    <motion.div
                      key="verify"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.24, ease: "easeInOut" }}
                      className="space-y-3.5"
                    >
                      <form onSubmit={handleVerifySubmit} className="space-y-3.5">
                        <div className="text-center mb-2">
                          <span className="text-xs text-slate-500 font-medium">
                            Enter code sent to <b className="text-slate-800">{signupEmail}</b>
                          </span>
                        </div>

                        <div>
                          <input
                            type="text"
                            required
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            placeholder="123456"
                            className="w-full px-5 py-3 rounded-full border border-slate-300 focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e]/15 outline-none text-center tracking-widest text-lg font-bold text-slate-800 transition-all bg-white font-mono shadow-2xs"
                          />
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-6 rounded-full bg-[#2d4a3e] hover:bg-[#223930] active:bg-[#182922] text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-[#2d4a3e]/20 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                          >
                            {loading ? (
                              <>
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Verifying...</span>
                              </>
                            ) : (
                              <span>Verify & Access Audit</span>
                            )}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  ) : (
                    /* ================= SIGN UP FORM (Saves Name to Profile) ================= */
                    <motion.div
                      key="signup"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.24, ease: "easeInOut" }}
                      className="space-y-3"
                    >
                      <form onSubmit={handleSignUpSubmit} className="space-y-3">
                        {/* Name (Saved to site profile) */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1 ml-1">
                            Full Name (Displayed on Profile)
                          </label>
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Ramesh Kumar"
                            className="w-full px-5 py-2.5 rounded-full border border-slate-300 hover:border-slate-400 focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e]/15 outline-none text-xs sm:text-sm text-slate-800 transition-all bg-white shadow-2xs font-medium"
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1 ml-1">
                            Email address
                          </label>
                          <input
                            type="email"
                            required
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full px-5 py-2.5 rounded-full border border-slate-300 hover:border-slate-400 focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e]/15 outline-none text-xs sm:text-sm text-slate-800 transition-all bg-white shadow-2xs font-medium"
                          />
                        </div>

                        {/* Password */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1 ml-1">
                            Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              placeholder="Create strong password"
                              className="w-full pl-5 pr-12 py-2.5 rounded-full border border-slate-300 hover:border-slate-400 focus:border-[#2d4a3e] focus:ring-2 focus:ring-[#2d4a3e]/15 outline-none text-xs sm:text-sm text-slate-800 transition-all bg-white shadow-2xs font-medium"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="pt-1.5">
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-6 rounded-full bg-[#2d4a3e] hover:bg-[#223930] active:bg-[#182922] text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-[#2d4a3e]/20 hover:shadow-lg hover:shadow-[#2d4a3e]/25 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                          >
                            {loading ? (
                              <>
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Creating Account...</span>
                              </>
                            ) : (
                              <span>Create Account</span>
                            )}
                          </button>
                        </div>
                      </form>

                      {/* Divider */}
                      <div className="relative my-3">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                            or sign up with
                          </span>
                        </div>
                      </div>

                      {/* Social OAuth */}
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleOAuth("oauth_google")}
                          className="h-10 w-13 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center shadow-2xs active:scale-95 cursor-pointer"
                          title="Sign up with Google"
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOAuth("oauth_microsoft")}
                          className="h-10 w-13 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center shadow-2xs active:scale-95 cursor-pointer"
                          title="Sign up with Microsoft"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 23 23">
                            <path fill="#f35325" d="M1 1h10v10H1z" />
                            <path fill="#81bc06" d="M12 1h10v10H12z" />
                            <path fill="#05a6f0" d="M1 12h10v10H1z" />
                            <path fill="#ffba08" d="M12 12h10v10H12z" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom Switching Link */}
            <div className="mt-5 text-center">
              {mode === "login" ? (
                <p className="text-xs text-slate-500 font-medium">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className="text-[#2d4a3e] font-extrabold hover:underline cursor-pointer"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-500 font-medium">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="text-[#2d4a3e] font-extrabold hover:underline cursor-pointer"
                  >
                    Log in
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* Right Column: 3D Botanical Papercut Art                  */}
          {/* ======================================================== */}
          <div className="md:col-span-5 relative hidden md:block overflow-hidden bg-[#162e22]">
            <img
              src="/images/botanical-art-flipped.jpg"
              alt="Tropical Botanical Papercut Art"
              className="w-full h-full object-cover object-left"
            />

            {/* High-Contrast Floating Pill Badge (100% Crisp Visible Text) */}
            <div className="absolute bottom-6 right-6 left-8 backdrop-blur-md bg-slate-950/85 border border-slate-700/80 rounded-2xl p-3.5 text-white shadow-2xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-black tracking-wider uppercase text-emerald-400">
                  ZERO DEDUCTIONS
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-100 leading-snug">
                Deterministic claim adjudication protecting patients across Bharat.
              </p>
            </div>
          </div>

        </div>

        {/* Mobile Background Watermark */}
        <div className="md:hidden absolute inset-0 -z-0 opacity-10 pointer-events-none">
          <img
            src="/images/botanical-art.jpg"
            alt="Botanical Background"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};
