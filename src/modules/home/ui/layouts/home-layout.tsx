import { SidebarProvider } from "@/components/ui/sidebar";
import React from "react";
import { HomeNavbar } from "../components/home-navbar";
import HomeSidebar from "../components/home-sidebar";

interface HomeLayoutProps {
  children?: React.ReactNode;
}

export const HomeLayout = ({ children }: HomeLayoutProps) => {
  return (
    <SidebarProvider>
      <div className=" w-full">
        <HomeNavbar />
        <div className="flex min-h-screen pt-[4rem]"> {/* ponemos 4rem porque el navbar tiene 4rem de altura (explicacion en 1:14:00) */}
          <HomeSidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};
