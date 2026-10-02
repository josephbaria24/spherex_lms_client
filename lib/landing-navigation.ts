export type LandingNavLink = {
  label: string
  href: string
  /** Section id on home page (without #). Omit for standalone routes. */
  sectionId?: string
  /** Renders hover dropdown instead of a plain link */
  dropdown?: "categories"
}

export const landingNavLinks: LandingNavLink[] = [
  { label: "Home", href: "/", sectionId: "home" },
  { label: "Our Courses", href: "/courses" },
  { label: "Categories", href: "/#categories", sectionId: "categories", dropdown: "categories" },
  { label: "Reviewers", href: "/reviewers" },
  { label: "IELTS", href: "/ielts" },
  { label: "Organizations", href: "/organizations" },
  { label: "About", href: "/#about", sectionId: "about" },
  { label: "Contact", href: "/#contact", sectionId: "contact" },
]
