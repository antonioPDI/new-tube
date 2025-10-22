"use client";

import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { ClapperboardIcon, UserCircleIcon } from "lucide-react";

const AuthButton = () => {
  //Todo: add diferent states for auth button
  return (
    <>
      <SignedIn>
        <UserButton>
          <UserButton.MenuItems>
            {/* todo: add user profile link */}
            <UserButton.Link
              href="/studio"
              label="Studio"
              labelIcon={<ClapperboardIcon className="size-4 " />}
            />
            {/* below studio button */}
            <UserButton.Action label="manageAccount" />
          </UserButton.MenuItems>
        </UserButton>
        {/* Add menu items for studio and user profile*/}
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal"> 
          <Button
            variant="outline"
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500
            border-blue-500/20 rounded-full shadow-none"
          >
            <UserCircleIcon /> Sign In
          </Button>
        </SignInButton>
      </SignedOut>
    </>
  );
};

export default AuthButton;
