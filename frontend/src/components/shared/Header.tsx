"use client";
import { AccountMenu } from "@/components/shared/AccountMenu";
import { AvatarIcon } from "@/components/ui/AvatarIcon";
import type { AvatarOption } from "@/constants/Avatar";
import { Navbar, NavbarBrand } from "flowbite-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type HeaderProps = {
  username: string;
  avatarImage: AvatarOption;
};

export function Header({ username, avatarImage }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleMenuItemClick = () => {
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    //TODO logic
    router.push("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header>
      <Navbar
        fluid
        className="h-[3rem] md:h-[4rem] px-3 md:px-8 border-b border-gray-200 bg-white [&>div]:h-full"
      >
        <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
          {/* logo */}
          <div className="flex items-center gap-10">
            <NavbarBrand as={Link} href="/">
              <span className="self-center whitespace-nowrap text-2xl font-semibold dark:text-white">
                Quizoo
              </span>
            </NavbarBrand>

            {/* nav */}
            <div className="flex items-center gap-6">
              <a href="/" className={`list-image-none ${pathname === "/" ? "active" : ""}`}>
                Home
              </a>
              <a href="/quiz" className={`list-image-none ${pathname === "/quiz" ? "active" : ""}`}>
                Quiz
              </a>
            </div>
          </div>

          {/* avatar and menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 focus:outline-none"
            >
              <span className="hidden md:inline-block">{username}</span>
              <AvatarIcon avatarImage={avatarImage} avatarSize="sm" />
            </button>
            {isDropdownOpen && (
              <AccountMenu handleMenuItemClick={handleMenuItemClick} handleLogout={handleLogout} />
            )}
          </div>
        </div>
      </Navbar>
    </header>
  );
}
