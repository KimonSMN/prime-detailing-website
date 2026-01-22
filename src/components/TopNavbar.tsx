// src/components/TopNavbar.tsx
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

const TopNavbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="mx-auto flex items-center justify-end gap-6 px-4 py-3 md:py-4">
        {/* Desktop menu */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-base font-medium ${
                isActive
                  ? "text-secondary"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/services"
            className={({ isActive }) =>
              `text-base font-medium ${
                isActive
                  ? "text-secondary"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            Services
          </NavLink>

          <NavLink
            to="/gallery"
            className={({ isActive }) =>
              `text-base font-medium ${
                isActive
                  ? "text-secondary"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            Gallery
          </NavLink>

          {/* Language selector (desktop) */}
          <div className="pl-2 border-l pr-2 border-r border-border">
            <LanguageSwitcher />
          </div>

          <Link
            to="/booking"
            className="
              rounded-full
              bg-secondary
              text-black
              px-5 py-2
              text-base font-semibold
              hover:bg-secondary-hover
              transition
            "
          >
            Book an Appointment
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-accent"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="absolute right-4 mt-2 w-56 rounded-lg border border-border bg-background shadow-lg md:hidden">
          {/* Language selector row */}
          <div className="flex justify-end p-2">
            <LanguageSwitcher />
          </div>
          <div className="h-px bg-border" />

          <nav className="flex flex-col p-2 text-right">
            <NavLink
              to="/"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-base font-medium text-foreground hover:text-secondary"
            >
              Home
            </NavLink>

            <NavLink
              to="/services"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-base font-medium text-foreground hover:text-secondary"
            >
              Services
            </NavLink>

            <NavLink
              to="/gallery"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-base font-medium text-foreground hover:text-secondary"
            >
              Gallery
            </NavLink>

            <NavLink
              to="/booking"
              onClick={() => setOpen(false)}
              className="
                block px-3 py-2
                rounded-md
                bg-secondary
                text-black
                text-base font-semibold
                hover:bg-secondary-hover
              
                text-center
              "
            >
              Book an Appointment
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
};

export default TopNavbar;
