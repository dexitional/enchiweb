// Posts, hero slides and the notice banner taken from the college's Facebook
// page (facebook.com/ENCEOFFICIALPAGE), October 2026. Each post keeps its
// original Facebook date. Images are in ./media: "<name>.webp" is a 16:9
// cover banner built around the post's flyer, "<name>-flyer.webp" the flyer
// itself, shown in full inside the article.

export interface FacebookPost {
  type: "news" | "announcement";
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string; // UTC (Ghana time)
  image: string; // media/<image>.webp and media/<image>-flyer.webp
  imageAlt: string;
  featured?: boolean;
  pinned?: boolean;
  // {{flyer}} is replaced with the uploaded flyer.
  body: string;
}

const ENQUIRIES =
  '<p><strong>Enquiries:</strong> <a href="tel:+233553512424">0553512424</a> · <a href="tel:+233533774500">0533774500</a> · <a href="tel:+233542840849">0542840849</a></p>';

export const POSTS: Array<FacebookPost> = [
  {
    type: "news",
    slug: "admission-list-2026-2027-is-out",
    title: "The 2026/2027 admission list is out",
    excerpt:
      "The first batch of admitted applicants for the 2026/2027 academic year has been published. Congratulations to all successful applicants.",
    category: "College News",
    publishedAt: "2026-10-01 10:56:06",
    image: "admission-list-out",
    imageAlt: "Admissions list is out — 2026/2027 academic year",
    featured: true,
    body: `
<p>The first batch of admitted applicants for the <strong>2026/2027 academic year</strong> is out. Congratulations to all successful applicants!</p>
<p>Check your admission status now, and pay your fees before the deadline to secure your place.</p>
<h2>Check if you have been admitted</h2>
<ol>
<li>Visit the college's admission list page on the website.</li>
<li>Search for your name on the 2026 admission list.</li>
<li>Found your name? Go to <a href="https://admissionsghana.com">admissionsghana.com</a> to print your admission letter.</li>
</ol>
<p>See also: <a href="/announcements/how-to-check-your-admission-status">3 ways to check your admission status</a>, <a href="/announcements/how-to-print-your-admission-letter">how to print your admission letter</a> and <a href="/announcements/how-to-pay-your-fees-2026-2027">how to pay your fees</a>.</p>
{{flyer}}
${ENQUIRIES}`,
  },
  {
    type: "announcement",
    slug: "how-to-print-your-admission-letter",
    title: "How to print your admission letter",
    excerpt:
      "Follow eight simple steps on admissionsghana.com to print your admission letter and download the prospectus and Students' Handbook.",
    category: "Admissions",
    publishedAt: "2026-10-01 17:57:33",
    image: "print-admission-letter",
    imageAlt: "How to print your admission letter — 2026/2027 admissions",
    body: `
<p>Follow the eight steps below on <a href="https://admissionsghana.com">admissionsghana.com</a> to get your admission letter, prospectus and Students' Handbook.</p>
<h2>Have these ready</h2>
<ul>
<li><strong>Application Number</strong> — starts with 26, on your application form.</li>
<li><strong>Your PIN</strong> — sent to you by text message.</li>
<li><strong>Phone Number</strong> — the one you used when applying.</li>
</ul>
<h2>Steps</h2>
<ol>
<li><strong>Visit the portal.</strong> When you receive the admission message, or see your name on the college website list, go to admissionsghana.com.</li>
<li><strong>Choose your college.</strong> Under <em>Category</em>, choose <em>College of Education</em>. Select Academic Year <em>2026</em> and <em>Enchi College of Education</em>, then click <em>Check</em>.</li>
<li><strong>Search your number.</strong> Enter your Application Number in the search box. Your full name will be displayed.</li>
<li><strong>Log in.</strong> Click <em>Print Letter</em>, then enter your Application Number and the PIN sent to you by text message.</li>
<li><strong>No PIN? Resend it.</strong> If you did not receive the PIN or have lost it, click <em>Resend Code</em> and enter the phone number you used when applying.</li>
<li><strong>Open your letter.</strong> After logging in, click <em>Print/Re-print Admission Letter</em> to open your admission letter page.</li>
<li><strong>Print and download.</strong> Click the blue <em>Print Letter</em> button at the top left to print your letter. Click <em>Download Documents</em> for the prospectus and Students' Handbook.</li>
<li><strong>Pay and begin onboarding.</strong> Follow the instructions in your admission letter to <a href="/announcements/how-to-pay-your-fees-2026-2027">pay your fees</a> and begin onboarding.</li>
</ol>
{{flyer}}
${ENQUIRIES}`,
  },
  {
    type: "announcement",
    slug: "esrp-has-moved",
    title: "ESRP has moved to esrp.enchicoe.edu.gh",
    excerpt:
      "The Enchicoe Students Registration Portal (ESRP) is now at a new address: esrp.enchicoe.edu.gh.",
    category: "Important",
    publishedAt: "2026-10-01 20:12:53",
    image: "esrp-has-moved",
    imageAlt: "ESRP has moved — log on at esrp.enchicoe.edu.gh",
    body: `
<p>The Enchicoe Students Registration Portal (ESRP) has moved to a new address. You can now log on at <a href="https://esrp.enchicoe.edu.gh/"><strong>esrp.enchicoe.edu.gh</strong></a>.</p>
<p>Use ESRP to register for the semester, check your fee balance, view your dining hall table, and register for a hall of residence and bed. <a href="/academics/esrp">Learn more about ESRP</a>.</p>
{{flyer}}`,
  },
  {
    type: "announcement",
    slug: "how-to-pay-your-fees-2026-2027",
    title: "How to pay your fees: 2026/2027 fresh students",
    excerpt:
      "Fresh students can pay fees at ADB, Access Bank or GCB, or by mobile money on *887*50#. Always use your Application Number and full name.",
    category: "Admissions",
    publishedAt: "2026-10-01 22:39:46",
    image: "how-to-pay-fees",
    imageAlt: "How to pay your fees — 2026/2027 fresh students",
    pinned: true,
    body: `
<p>Fresh students for the 2026/2027 academic year can pay their fees using any one of the four options below.</p>
<h2>Payment options</h2>
<ol>
<li><strong>ADB Bank Ltd.</strong> — any networked branch.</li>
<li><strong>Access Bank</strong> — any networked branch, using <em>Translow</em>.</li>
<li><strong>GCB PLC</strong> — any networked branch, using <em>Eagle Smartpay</em>.</li>
<li><strong>Mobile money</strong> — dial <strong>*887*50#</strong>.</li>
</ol>
<h2>Important</h2>
<p>For every payment, use your <strong>Application Number</strong> as your Student ID, together with your <strong>full name</strong>. Payments without the correct number and name may not be credited to your account.</p>
<p>Once your payment is confirmed, you will be added to the official Level 100 WhatsApp group and enrolled on the <a href="https://esrp.enchicoe.edu.gh/">Enchicoe Students Registration Portal (ESRP)</a> to begin onboarding.</p>
{{flyer}}
${ENQUIRIES}`,
  },
  {
    type: "announcement",
    slug: "how-to-check-your-admission-status",
    title: "3 ways to check your admission status",
    excerpt:
      "Check your 2026/2027 admission status on the college website, on admissionsghana.com, or on the college notice board.",
    category: "Admissions",
    publishedAt: "2026-10-05 10:47:57",
    image: "check-admission-status",
    imageAlt: "3 ways to check your admission status",
    pinned: true,
    body: `
<p>There are three ways to check your admission status for the 2026/2027 academic year:</p>
<ol>
<li><strong>College website</strong> — visit the admission list page and enter your <strong>Application No.</strong> or <strong>Surname</strong>.</li>
<li><strong>Admissions Ghana</strong> — visit <a href="https://admissionsghana.com">admissionsghana.com</a> and enter your <strong>Application No.</strong></li>
<li><strong>On campus</strong> — visit the College Notice Board.</li>
</ol>
<p>Admitted? Next, <a href="/announcements/how-to-print-your-admission-letter">print your admission letter</a> and <a href="/announcements/how-to-pay-your-fees-2026-2027">pay your fees</a>.</p>
{{flyer}}`,
  },
];

// Home page hero slides, added ahead of the existing ones. Campus photos
// rather than flyers: the hero is full-bleed with text over the image.
export const SPOTLIGHTS = [
  {
    eyebrow: "Admissions 2026/2027",
    title: "The admission list is out",
    caption:
      "Congratulations to all successful applicants. Check your status, print your letter and pay your fees to secure your place.",
    image: "/seed/matriculation-freshers.webp",
    ctaLabel: "Check your status",
    ctaUrl: "/announcements/how-to-check-your-admission-status",
  },
  {
    eyebrow: "Fresh students",
    title: "Welcome to Enchi — let's get you started",
    caption:
      "Pay your fees at ADB, Access Bank, GCB or by mobile money, then begin onboarding on ESRP.",
    image: "/seed/students-steps.webp",
    ctaLabel: "How to pay your fees",
    ctaUrl: "/announcements/how-to-pay-your-fees-2026-2027",
  },
];

// The site-wide notice bar.
export const NOTICE = {
  enabled: true,
  label: "Admissions",
  title: "The 2026/2027 admission list is out",
  text: "Check your status, print your admission letter and pay your fees to secure your place.",
  linkLabel: "Check your status",
  linkUrl: "/announcements/how-to-check-your-admission-status",
  expiresOn: "",
};
