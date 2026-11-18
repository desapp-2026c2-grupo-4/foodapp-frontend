import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BadgePercent,
  BarChart3,
  BookOpen,
  Boxes,
  Building2,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  Image as ImageIcon,
  Package,
  Settings,
  SlidersHorizontal,
  Tags,
  UserCog,
  Users,
} from "lucide-react";

const NAV_ITEMS = [
  { type: "link", to: "/empleados/pedidos", label: "Pedidos", icon: ClipboardList },
  {
    type: "group",
    label: "Catálogo",
    icon: BookOpen,
    items: [
      { to: "/admin/productos", label: "Productos", icon: Package },
      { to: "/admin/categorias", label: "Categorías", icon: Tags },
      { to: "/admin/materias-primas", label: "Materias primas", icon: Boxes },
      { to: "/admin/promociones", label: "Promociones", icon: BadgePercent },
      { to: "/admin/banners", label: "Banners", icon: ImageIcon },
    ],
  },
  { type: "link", to: "/admin/reportes", label: "Reportes", icon: BarChart3 },
  {
    type: "group",
    label: "Administración",
    align: "right",
    icon: Settings,
    items: [
      { to: "/admin/clientes", label: "Clientes", icon: Users },
      { to: "/admin/sucursales", label: "Sucursales", icon: Building2 },
      { to: "/admin/empleados", label: "Empleados", icon: UserCog },
      { to: "/admin/parametros", label: "Parámetros", icon: SlidersHorizontal },
    ],
  },
  { type: "link", to: "/catalogo", label: "Ver tienda", icon: ExternalLink },
];

const isActive = (pathname, to) => pathname === to || pathname.startsWith(`${to}/`);

function DesktopDropdown({ group, pathname, open, onToggle, onClose }) {
  const ref = useRef(null);
  const active = group.items.some((item) => isActive(pathname, item.to));
  const GroupIcon = group.icon;

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onClose();
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="true"
        aria-expanded={open}
        className={`flex items-center gap-2 font-medium transition-colors hover:text-[#F8A426] ${active ? "text-[#F8A426]" : ""}`}
      >
        <GroupIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{group.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className={`absolute top-full z-30 mt-2 w-56 rounded-md border border-white/10 bg-[#2f2621] py-1 shadow-xl ${group.align === "right" ? "right-0" : "left-0"}`}>
          {group.items.map((item) => {
            const itemActive = isActive(pathname, item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                aria-current={itemActive ? "page" : undefined}
                className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-white/10 hover:text-[#F8A426] ${itemActive ? "font-semibold text-[#F8A426]" : ""}`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AdminDesktopNav() {
  const { pathname } = useLocation();

  return <AdminDesktopNavContent key={pathname} pathname={pathname} />;
}

function AdminDesktopNavContent({ pathname }) {
  const [openMenu, setOpenMenu] = useState(null);

  return (
    <>
      {NAV_ITEMS.map((item) => {
        if (item.type === "group") {
          return (
            <DesktopDropdown
              key={item.label}
              group={item}
              pathname={pathname}
              open={openMenu === item.label}
              onToggle={() => setOpenMenu((current) => (current === item.label ? null : item.label))}
              onClose={() => setOpenMenu(null)}
            />
          );
        }

        const active = isActive(pathname, item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 font-medium transition-colors hover:text-[#F8A426] ${active ? "text-[#F8A426]" : ""}`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}

export function AdminMobileNav({ onNavigate }) {
  const { pathname } = useLocation();

  return <AdminMobileNavContent key={pathname} pathname={pathname} onNavigate={onNavigate} />;
}

function AdminMobileNavContent({ pathname, onNavigate }) {
  const [openGroup, setOpenGroup] = useState(null);

  const handleNavigate = () => {
    setOpenGroup(null);
    onNavigate?.();
  };

  return (
    <>
      {NAV_ITEMS.map((item) => {
        if (item.type === "group") {
          const active = item.items.some((child) => isActive(pathname, child.to));
          const expanded = openGroup === item.label;
          const GroupIcon = item.icon;

          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => setOpenGroup((current) => (current === item.label ? null : item.label))}
                aria-expanded={expanded}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-2.5 text-sm font-medium transition-colors hover:bg-white/10 hover:text-[#F8A426] ${active ? "text-[#F8A426]" : ""}`}
              >
                <GroupIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
                <ChevronDown
                  className={`ml-auto h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {expanded && (
                <div className="ml-2 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                  {item.items.map((child) => {
                    const childActive = isActive(pathname, child.to);
                    const Icon = child.icon;
                    return (
                      <Link
                        key={child.to}
                        to={child.to}
                        onClick={handleNavigate}
                        aria-current={childActive ? "page" : undefined}
                        className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-white/10 hover:text-[#F8A426] ${childActive ? "font-semibold text-[#F8A426]" : ""}`}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        const active = isActive(pathname, item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={handleNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 rounded-md px-2 py-2.5 text-sm font-medium transition-colors hover:bg-white/10 hover:text-[#F8A426] ${active ? "text-[#F8A426]" : ""}`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}
