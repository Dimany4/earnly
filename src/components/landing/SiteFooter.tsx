import Link from "next/link";
import { EarnlyMark } from "@/components/AppShell";
import { Icon } from "@/components/ui";
import { CurrentYear } from "./CurrentYear";

const GITHUB = "https://github.com/Cyon0x/earnly";
const EMAIL = "Cyon0x@users.noreply.github.com";

const COLUMNS = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Product",
    links: [
      { label: "Find work", href: "/app/tasks" },
      { label: "Asset Leasing", href: "/app/leasing" },
      { label: "Inventory Loans", href: "/app/loans" },
      { label: "Digital Pawn Shop", href: "/app/pawn" },
    ],
  },
  {
    title: "Students",
    links: [
      { label: "Create an account", href: "/signin" },
      { label: "How it works", href: "/#how" },
      { label: "AI opportunity finder", href: "/app/ai" },
      { label: "Frequently asked questions", href: "/#faq" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto max-w-[1240px] px-5 py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_1.4fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <EarnlyMark size={26} />
              <span className="display-tight text-[19px]">Earnly</span>
            </Link>
            <p className="mt-4 max-w-[42ch] text-[13.5px] leading-relaxed text-ink2">
              A verified student opportunity and earning platform. Earn while you learn, and
              graduate with a record of work instead of an empty CV.
            </p>

            <div className="mt-6">
              <div className="eyebrow mb-3">Contact</div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`mailto:${EMAIL}`}
                  className="inline-flex items-center gap-2 rounded-full border border-rule px-4 py-2.5 text-[13px] font-semibold text-ink2 transition-colors hover:border-ink/30 hover:text-ink"
                >
                  <Icon name="mail" size={15} />
                  Gmail
                </a>
                <a
                  href={GITHUB}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 rounded-full border border-rule px-4 py-2.5 text-[13px] font-semibold text-ink2 transition-colors hover:border-ink/30 hover:text-ink"
                >
                  <Icon name="github" size={15} />
                  GitHub
                </a>
              </div>
              <p className="mt-3 break-all text-[12px] text-ink3">{EMAIL}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <div className="eyebrow mb-3">{col.title}</div>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-[13.5px] text-ink2 transition-colors hover:text-ink"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule pt-6">
          <span className="text-[12.5px] text-ink3">
            © <CurrentYear initialYear={new Date().getFullYear()} /> Earnly. Prototype — demo data throughout.
          </span>
          <span className="text-[12.5px] text-ink3">
            Paid in USDC · Off-ramp to local currency coming soon
          </span>
          <nav className="ml-auto flex flex-wrap items-center gap-5 text-[12.5px] text-ink3">
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-ink">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
