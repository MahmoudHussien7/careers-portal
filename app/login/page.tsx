"use client";

import { Spinner } from "@/Components/atoms/Spinner";
import { LoginForm } from "./_components/LoginForm";

export default function LoginPage() {
  return (
    <LoginForm
      onLoading={() => (
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </div>
      )}
    />
  );
}
