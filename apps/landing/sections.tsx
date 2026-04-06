export const sectionLinks = [
  "#home",
  "#resources",
  "#pricing",
  "#about-us",
  "#faq",
] as const;

export type SectionHref = (typeof sectionLinks)[number];

export type Section = {
  label: string;
  href: SectionHref;
};

export const sections: Section[] = [
  { label: "Início", href: "#home" },
  { label: "Funções", href: "#resources" },
  { label: "Preços", href: "#pricing" },
  { label: "Sobre nós", href: "#about-us" },
  { label: "Suporte", href: "#faq" },
];

export enum SectionID {
  HOME = "home",
  RESOURCES = "resources",
  PRICING = "pricing",
  ABOUT_US = "about-us",
  FAQ = "faq",
}
