import Image from "next/image";
import { Icon, Stars } from "@/components/ui";

const PEOPLE = [
  {
    name: "Priya Sharma",
    role: "Freelance Photographer",
    avatar: "/img/avatar-2.jpg",
    quote:
      "Earnly helped me monetize my camera equipment when I'm not shooting. I earn ₹2,000+ monthly just by renting out my gear!",
    stars: 5,
    tag: "Asset Leasing preview",
  },
  {
    name: "Rajesh Kumar",
    role: "Uber Driver",
    avatar: "/img/avatar-3.jpg",
    quote:
      "Got instant advance against my weekly earnings. Perfect for emergency expenses without any paperwork hassle.",
    stars: 5,
    tag: "Earnings advance preview",
  },
  {
    name: "Meera Patel",
    role: "Small Retailer",
    avatar: "/img/avatar-1.jpg",
    quote:
      "The inventory loan helped me stock up for festival season. Sales increased by 40% and repayment was flexible.",
    stars: 5,
    tag: "Inventory Loans preview",
  },
];

export function Testimonials() {
  return (
    <section className="border-t border-rule">
      <div className="mx-auto max-w-[1240px] px-5 py-16">
        <span className="eyebrow">What our users say</span>
        <h2 className="display mt-3 max-w-[24ch] text-[32px] sm:text-[44px]">
          Real stories from real people who transformed their finances
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {PEOPLE.map((p, i) => (
            <figure
              key={p.name}
              className={`flex flex-col border border-rule bg-raised p-6 ${
                i === 1 ? "tagshape-b" : "tagshape"
              }`}
            >
              <span className="text-accentx">
                <Icon name="quote" size={22} />
              </span>
              <blockquote className="mt-4 flex-1 text-[14.5px] leading-relaxed text-ink">
                “{p.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-rule pt-5">
                <Image
                  src={p.avatar}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 flex-none rounded-full object-cover"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-bold">{p.name}</span>
                    {i === 0 ? (
                      <span className="flex-none text-accentx">
                        <Icon name="badge" size={13} filled />
                      </span>
                    ) : null}
                  </div>
                  <div className="truncate text-[12px] text-ink3">{p.role}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <Stars value={p.stars} size={11} />
                    <span className="text-[10.5px] text-ink3">{p.tag}</span>
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="mt-5 text-[12.5px] leading-relaxed text-ink3">
          Quotes describe the earning products Earnly is building. They are shown here as product
          previews, not as earned results on this prototype.
        </p>
      </div>
    </section>
  );
}
