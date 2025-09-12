"use client";

import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { UserCircleIcon } from "lucide-react";
import React from "react";

const AuthButton = () => {
  //Todo: add diferent states for auth button
  return (
    <>
      <SignedIn>
        <UserButton />
        {/* Add menu items for studio and user profile*/}
      </SignedIn>
      <SignedOut>
        <SignInButton>
          <Button
            variant="outline"
            className="px-4 py-2 font-medium text-blue-600 hover:text-blue-500 border-blue-600 hover:border-blue-500/20 rounded-full shadow-none"
          >
            <UserCircleIcon /> Sign In
          </Button>
        </SignInButton>
      </SignedOut>
    </>
  );
};

export default AuthButton;
