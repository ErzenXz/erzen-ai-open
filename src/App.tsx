// App.tsx
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { Toaster } from "sonner";
import { ChatInterface } from "./components/ChatInterface";
import { ParticlesBackground } from "./components/ParticlesBackground";

export default function App() {
  return (
    <>
      <Authenticated>
        {/* The authenticated view has its own layout and background */}
        <div className="min-h-screen flex flex-col bg-gray-50">
          <ChatInterface />
        </div>
      </Authenticated>

      <Unauthenticated>
        {/* This container provides the full-screen background for the login page */}
        <div className="relative min-h-screen w-full bg-gray-950">
          {/* Layer 1: The animated background */}
          <div className="absolute inset-0 z-0">
            <ParticlesBackground />
          </div>

          {/* Layer 2: The content, layered on top */}
          <div className="relative z-10 flex flex-col min-h-screen">
            <main className="flex-1 flex items-center justify-center p-4">
              <div className="w-full max-w-md mx-auto text-center">
                <h1 className="text-5xl font-bold text-white mb-4">
                  ErzenAI
                </h1>
                <p className="text-xl text-gray-300 mb-8">
                  Sign in to start chatting
                </p>
                <SignInForm />
              </div>
            </main>
          </div>
        </div>
      </Unauthenticated>

      {/* Toaster should be outside to work for both states.
          Set theme to dark to match the login screen. */}
      <Toaster theme="dark" richColors />
    </>
  );
}