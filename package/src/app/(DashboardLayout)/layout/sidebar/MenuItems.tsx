import {
    IconAperture, IconBrandFeedly,
    IconCopy,
    IconLayoutDashboard,
    IconLogin, IconMenuOrder,
    IconMoodHappy, IconPrinter, IconReplace,
    IconTypography,
    IconUserPlus,
} from "@tabler/icons-react";

import { uniqueId } from "lodash";

const Menuitems = [
  {
    navlabel: true,
    subheader: "HOME",
  },

  {
    id: uniqueId(),
    title: "Inicio",
    icon: IconLayoutDashboard,
    href: "/",
  },
  {
    navlabel: true,
    subheader: "Equipo",
  },
  {
    id: uniqueId(),
    title: "Impresoras",
    icon: IconPrinter,
    href: "/utilities/impresora",
  },
  {
    id: uniqueId(),
    title: "Repuestos",
    icon: IconReplace,
    href: "/utilities/repuesto",
  },
  {
    navlabel: true,
    subheader: " Movimientos",
  },
  {
    id: uniqueId(),
    title: "Consumo de Repuestos",
    icon: IconBrandFeedly,
    href: "/consumo-repuesto",
  },
  {
    id: uniqueId(),
    title: "Orden de mantenimiento",
    icon: IconMenuOrder,
    href: "/orden-mantenimiento",
  },

];

export default Menuitems;