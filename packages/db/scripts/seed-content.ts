// Starter content so a fresh install has a complete site structure to edit:
// every menu page (with page-builder blocks), units, management, hero slides
// and a welcome post. Idempotent — rows that already exist (same
// section+slug, kind+slug, type+slug) are left untouched, so it never
// overwrites edits made in the CMS. People and spotlights have no natural key
// and are only seeded into an empty table.
//
// Wording, names and photos come from the college's previous website
// (enchicoe.edu.gh, October 2026), lightly edited. Images live in
// apps/web/public/seed/ and can be replaced from the CMS at any time.
// Placeholders in [brackets] (SRC, alumni, unit heads not named on the old
// site) should be replaced in Admin → People and Admin → Departments & Units.
import "dotenv/config";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";

const id = () => randomUUID().slice(0, 12);
const p = (...paras: Array<string>) => paras.map((t) => `<p>${t}</p>`).join("");
const img = (name: string) => `/seed/${name}.webp`;

type Block = Record<string, unknown>;

interface PageSeed {
  section: string;
  slug: string;
  title: string;
  summary: string;
  heroImage?: string;
  body?: string;
  blocks: Array<Block>;
  draft?: boolean;
}

const CORE_VALUES = {
  id: id(),
  type: "cards",
  title: "Core values",
  intro: "",
  columns: 3,
  items: [
    { title: "Excellence", text: "High standards in teaching, learning and service.", imageUrl: "", url: "" },
    { title: "Diligence", text: "Discipline and commitment in everything we do.", imageUrl: "", url: "" },
    { title: "Inclusiveness", text: "A college community open to every background and perspective.", imageUrl: "", url: "" },
  ],
};

const PAGES: Array<PageSeed> = [
  // ---- About Us ------------------------------------------------------------
  {
    section: "about",
    slug: "overview",
    title: "About the College",
    summary: "A public College of Education in Enchi, Western North Region, affiliated to the University of Ghana.",
    heroImage: img("campus-aerial"),
    body: p(
      "Enchi College of Education is a teacher education college in Enchi, in the Western North Region of Ghana. It is one of the public Colleges of Education in Ghana, recognised by the Ghana Tertiary Education Commission (GTEC) and affiliated to the University of Ghana.",
      "The college offers the Bachelor of Education programmes in Early Grade Education, Upper Primary Education and Junior High School Education, with JHS specialisms in English, French, Religious and Moral Education, Geography, Social Studies and History.",
    ),
    blocks: [
      {
        id: id(),
        type: "stats",
        title: "",
        items: [
          { value: "1965", label: "Year founded" },
          { value: "1,200+", label: "Student-teachers" },
          { value: "3", label: "B.Ed programmes" },
          { value: "8,814+", label: "Teachers trained" },
        ],
      },
      {
        id: id(),
        type: "cards",
        title: "Achievements",
        intro: "",
        columns: 2,
        items: [
          {
            title: "No. 1 for curriculum fidelity, 2023",
            text: "The college emerged as the Number One College for the Fidelity of Implementation of the Bachelor of Education Curriculum among all Colleges of Education in Ghana.",
            imageUrl: "",
            url: "",
          },
          {
            title: "Best UG-affiliated college, 2024",
            text: "The college was named the overall best among all Colleges of Education affiliated to the University of Ghana, Legon, and its former Principal, Mr. Philip Ntaah, was named best Principal.",
            imageUrl: "",
            url: "",
          },
        ],
      },
      {
        id: id(),
        type: "imageText",
        title: "Our location",
        html: p(
          "The college is located in Enchi, the capital of the Aowin Municipality in the Western North Region of Ghana.",
        ),
        imageUrl: img("enchi-township"),
        imageAlt: "Aerial view of Enchi township",
        imagePosition: "right",
      },
    ],
  },
  {
    section: "about",
    slug: "history",
    title: "History of the College",
    summary: "From a post-middle teacher training college founded in 1965 to a B.Ed-awarding College of Education.",
    heroImage: img("campus-aerial-3"),
    body: p(
      "Enchi College of Education was established in 1965 as a male institution and became co-educational a decade later with the admission of 35 women in 1975. It relocated to its present site in 1978. The college's original campus, at the southern end of Enchi township, is now used by the Nana Brentu Secondary Technical School.",
      "The college started with a four-year post-middle Teacher's Certificate 'A' programme. The first Principal of the college was Mr. Djeo Addison. The college was converted into a three-year post-secondary teacher training college in 1988.",
      "In the 2002/2003 academic year, the University of Education, Winneba chose the college as the Western Regional Centre for its Distance Education Programme, preparing Certificate 'A' teachers for the Diploma in Basic Education. In October 2019, the college started the Bachelor of Education programmes. It also runs distance programmes with the University of Cape Coast, the University of Education, Winneba and Jackson College of Education alongside its regular programmes.",
      "From an initial enrolment of 70 students and 9 academic staff, the college had produced over 8,814 teachers by the 2022/2023 academic year, many of whom now hold enviable positions across the country.",
      "Despite a busy teaching and practice schedule, there are many ways for students to get involved in extracurricular activities, and the college proudly counts sports personalities who have excelled at regional, national and international level among its alumni.",
    ),
    blocks: [
      {
        id: id(),
        type: "stats",
        title: "Milestones",
        items: [
          { value: "1965", label: "Founded" },
          { value: "1975", label: "Became co-educational" },
          { value: "1978", label: "Moved to present site" },
          { value: "2019", label: "B.Ed programmes began" },
        ],
      },
    ],
  },
  {
    section: "about",
    slug: "mission-and-vision",
    title: "Mission & Vision",
    summary: "What the college exists to do, and what it aspires to be.",
    heroImage: img("crest-monument"),
    blocks: [
      {
        id: id(),
        type: "cards",
        title: "",
        intro: "",
        columns: 2,
        items: [
          {
            title: "Mission",
            text: "Enchi College of Education exists to provide a congenial learning environment that produces quality and lifelong specialist teachers.",
            imageUrl: "",
            url: "",
          },
          {
            title: "Vision",
            text: "To be a leading centre of teaching, research, and holistic teacher education in Ghana and beyond.",
            imageUrl: "",
            url: "",
          },
        ],
      },
      CORE_VALUES,
      {
        id: id(),
        type: "quote",
        quote: "Light Expels Darkness",
        author: "College motto",
        role: "",
        imageUrl: "",
      },
    ],
  },
  {
    section: "about",
    slug: "office-of-the-principal",
    title: "Office of the Principal",
    summary: "The Principal provides academic and administrative leadership for the college.",
    heroImage: img("matriculation-dais"),
    blocks: [
      {
        id: id(),
        type: "quote",
        quote:
          "We are thrilled to invite you to become a valued member of our college community. A heartfelt welcome awaits you as you embark on this journey with us to explore and unlock your fullest potential.",
        author: "Prof. Francis Kwaw Andoh",
        role: "Principal",
        imageUrl: img("principal"),
      },
      {
        id: id(),
        type: "richText",
        html: p(
          "The Office of the Principal oversees the academic, administrative and welfare affairs of the college, working with the Governing Council, management and staff to deliver quality teacher education.",
        ),
      },
      { id: id(), type: "people", title: "The Principal's office", intro: "", group: "principal_office", layout: "grid" },
    ],
  },
  {
    section: "about",
    slug: "management",
    title: "College Management",
    summary: "The key management members responsible for the leadership of the college.",
    heroImage: img("matriculation-procession"),
    blocks: [
      { id: id(), type: "people", title: "Key management members", intro: "", group: "management", layout: "grid" },
      { id: id(), type: "people", title: "Governing Council", intro: "", group: "governing_council", layout: "list" },
      CORE_VALUES,
    ],
  },
  {
    section: "about",
    slug: "accreditation",
    title: "Accreditation & Institutional Status",
    summary: "A recognised public College of Education, affiliated to the University of Ghana.",
    heroImage: img("crest-monument-garden"),
    body: p(
      'Enchi College of Education is a recognised public College of Education in Ghana under the tertiary education regulatory framework of the <a href="https://gtec.edu.gh/institutions/?category=Public+College+of+Education">Ghana Tertiary Education Commission (GTEC)</a>.',
      'The college is affiliated to the <a href="https://coe.ug.edu.gh/">University of Ghana</a> for the delivery of its Bachelor of Education programmes.',
    ),
    blocks: [],
  },
  {
    section: "about",
    slug: "contact-us",
    title: "Contact Us",
    summary: "Get in touch with the college — we're happy to help.",
    blocks: [{ id: id(), type: "contact", title: "Get in touch", intro: "Send us a message and the right office will respond.", showForm: true, showMap: true }],
  },

  // ---- Academics -----------------------------------------------------------
  {
    section: "academics",
    slug: "programmes",
    title: "Our Programmes",
    summary: "Four-year Bachelor of Education programmes for Ghana's basic schools, awarded by the University of Ghana.",
    heroImage: img("students-studying"),
    blocks: [
      {
        id: id(),
        type: "cards",
        title: "",
        intro: "",
        columns: 3,
        items: [
          {
            title: "B.Ed Early Grade Education",
            text: "Equips aspiring teachers with the knowledge, skills and practical experience to teach effectively in the early years of basic education (Kindergarten to Primary 3), with a focus on foundational literacy, numeracy and holistic child development.",
            imageUrl: "",
            url: "",
          },
          {
            title: "B.Ed Upper Primary Education",
            text: "Prepares teachers for Primary 4 to Primary 6, building the pedagogical skills, subject knowledge and practical experience to foster academic growth and holistic development in learners aged 9 to 12.",
            imageUrl: "",
            url: "",
          },
          {
            title: "B.Ed JHS Education",
            text: "Prepares teachers for junior high school (Basic 7 to 9), with specialisms in English, French, Religious and Moral Education, Geography, Social Studies and History.",
            imageUrl: "",
            url: "",
          },
        ],
      },
      {
        id: id(),
        type: "stats",
        title: "Student records",
        items: [
          { value: "300+", label: "Early Grade students" },
          { value: "400+", label: "Upper Primary students" },
          { value: "500+", label: "JHS students" },
          { value: "1,200+", label: "Total students" },
        ],
      },
      { id: id(), type: "cta", title: "Ready to apply?", text: "Find out how to apply through the Colleges of Education admission portal.", buttonLabel: "How to apply", buttonUrl: "/admissions/how-to-apply", tone: "navy" },
    ],
  },
  {
    section: "academics",
    slug: "academic-calendar",
    title: "Academic Calendar",
    summary: "Schedules and activities for the current academic year, with timetables and the student handbook.",
    heroImage: img("matriculation-freshers"),
    body: p(
      "The Academic Calendar and related information are regularly updated and communicated to students through official channels, including the college website, notice boards and student portals. Students are encouraged to stay informed and plan their activities accordingly to ensure a smooth and successful academic experience at Enchi College of Education.",
    ),
    blocks: [
      { id: id(), type: "documents", title: "Calendars & timetables", intro: "The academic calendar, CA and examination timetables.", category: "timetable", limit: 10 },
      {
        id: id(),
        type: "documents",
        title: "Student handbook",
        intro: "A comprehensive guide to the college's policies, procedures and resources.",
        category: "handbook",
        limit: 5,
      },
    ],
  },
  {
    section: "academics",
    slug: "esrp",
    title: "Student Registration Portal (ESRP)",
    summary: "Register online each semester, check fees and book your hall of residence.",
    heroImage: img("students-assembly"),
    blocks: [
      {
        id: id(),
        type: "imageText",
        title: "Enchicoe Student Registration Portal",
        html: p(
          "With ESRP, students can register online, saving time and effort. The portal lets students check their fee balance, view their dining hall table, register for a hall of residence and bed, and print a receipt after registration.",
          "ESRP also includes attendance tracking, so students are confirmed as physically present on campus before registering for the semester.",
        ),
        imageUrl: img("esrp-portal"),
        imageAlt: "The ESRP sign-in page",
        imagePosition: "right",
      },
      { id: id(), type: "cta", title: "Register for the semester", text: "Sign in to ESRP with your student ID and PIN.", buttonLabel: "Register now", buttonUrl: "https://esrp.enchicoe.edu.gh/", tone: "crest" },
    ],
  },
  {
    section: "academics",
    slug: "units",
    title: "Units of the College",
    summary: "The offices and units that support teaching, learning and the running of the college.",
    blocks: [{ id: id(), type: "departments", title: "", intro: "", kind: "unit" }],
  },
  {
    // Not published: the old site lists no academic departments. Add them in
    // Admin → Departments & Units, then publish this page.
    section: "academics",
    slug: "departments",
    title: "Academic Departments",
    summary: "Our departments deliver the four-year Bachelor of Education programmes.",
    blocks: [{ id: id(), type: "departments", title: "", intro: "", kind: "department" }],
    draft: true,
  },

  // ---- Admissions ----------------------------------------------------------
  {
    section: "admissions",
    slug: "how-to-apply",
    title: "How to Apply",
    summary: "Your journey starts here: discover a world of possibilities at Enchi College of Education.",
    heroImage: img("matriculation-student"),
    body: p(
      "Enchi College of Education welcomes students from Ghana and beyond, embracing individuals with diverse perspectives, experiences, backgrounds and cultures. This inclusive environment fosters a rich and vibrant learning community where students can grow both academically and personally.",
    ),
    blocks: [
      {
        id: id(),
        type: "callout",
        tone: "info",
        title: "Applications are made online",
        text: "Admission to Colleges of Education in Ghana is through the common Colleges of Education admission portal (admission.coeportal.edu.gh). Watch the Announcements page for opening dates and admission lists.",
      },
      {
        id: id(),
        type: "steps",
        title: "Steps to apply",
        intro: "",
        items: [
          { title: "Check the entry requirements", text: "Read the admission requirements on the Colleges of Education admission portal." },
          { title: "Read the step-by-step guide", text: "The admission portal explains how to buy a voucher and complete the online application." },
          { title: "Apply online and choose Enchi", text: "Complete the online form, choose Enchi College of Education and your programme, and upload the required documents." },
          { title: "Check your admission status", text: "Admission lists are published by the college; successful applicants receive reporting instructions." },
        ],
      },
      { id: id(), type: "cta", title: "Start your application", text: "Read the easy step-by-step guide on the admission portal.", buttonLabel: "Go to the portal", buttonUrl: "https://admission.coeportal.edu.gh/index.html", tone: "crest" },
      { id: id(), type: "documents", title: "Admission documents", intro: "", category: "admissions", limit: 10 },
    ],
  },
  {
    section: "admissions",
    slug: "entry-requirements",
    title: "Entry Requirements",
    summary: "Minimum academic requirements for admission to the B.Ed programmes.",
    body: p(
      'Entry requirements for the Bachelor of Education programmes are set nationally for all Colleges of Education and published each year on the <a href="https://admission.coeportal.edu.gh/admissionrequirements.html">Colleges of Education admission portal</a>. Please check the portal for the requirements that apply in the current year.',
    ),
    blocks: [{ id: id(), type: "cta", title: "Ready to apply?", text: "Follow our step-by-step guide.", buttonLabel: "How to apply", buttonUrl: "/admissions/how-to-apply", tone: "navy" }],
  },
  {
    section: "admissions",
    slug: "contact-admissions",
    title: "Contact Admissions",
    summary: "Questions about applying to Enchi College of Education.",
    body: p(
      "Enchi College of Education, P.O. Box 44, Enchi, Western North Region.",
      'Call <a href="tel:+233553512424">+233 (0) 55 351 2424</a> or <a href="tel:+233533774500">+233 (0) 53 377 4500</a>, or email <a href="mailto:info@enchicoe.edu.gh">info@enchicoe.edu.gh</a>.',
    ),
    blocks: [{ id: id(), type: "contact", title: "Send us a message", intro: "", showForm: true, showMap: false }],
  },

  // ---- Student Life --------------------------------------------------------
  {
    section: "student-life",
    slug: "campus-life",
    title: "Campus Life",
    summary: "A diverse community with the academic and non-academic resources for a well-rounded experience.",
    heroImage: img("students-group"),
    body: p(
      "The campus experience at Enchi College of Education is enriched by the diversity of students and staff from various backgrounds. Both residential and non-residential students have full access to the college's academic resources, including lecture halls, libraries, departments and research facilities.",
      "In addition to academic support, students can take advantage of a wide range of non-academic resources: health services at the college clinic, career guidance and counselling, postal and banking facilities, dining with local and continental dishes, shops, printing services, sports facilities and free wireless internet across the campus.",
    ),
    blocks: [
      {
        id: id(),
        type: "gallery",
        title: "Life on campus",
        images: [
          { url: img("students-celebrating"), caption: "" },
          { url: img("students-steps"), caption: "" },
          { url: img("sports-football"), caption: "Sports on campus" },
          { url: img("matriculation-freshers"), caption: "Matriculation" },
          { url: img("students-studying"), caption: "" },
          { url: img("students-group"), caption: "" },
        ],
      },
    ],
  },
  {
    section: "student-life",
    slug: "information-for-freshers",
    title: "Information for Freshers",
    summary: "Everything you need for a smooth start at Enchi College of Education.",
    heroImage: img("matriculation-student"),
    body: p(
      "You are warmly invited to pursue your studies at Enchi College of Education. Your experience here will be both academically challenging and immensely fulfilling, provided you manage your time effectively to balance your studies with extracurricular activities.",
      "Find the essential information on admissions and enrolment below to ensure a smooth start to your educational journey.",
    ),
    blocks: [
      {
        id: id(),
        type: "cards",
        title: "",
        intro: "",
        columns: 3,
        items: [
          { title: "Admissions", text: "How to apply, entry requirements and admission lists.", imageUrl: "", url: "/admissions" },
          { title: "Register on ESRP", text: "Register for the semester and book your hall and bed.", imageUrl: "", url: "/academics/esrp" },
          { title: "Academic calendar", text: "Key dates, timetables and the student handbook.", imageUrl: "", url: "/academics/academic-calendar" },
        ],
      },
    ],
  },
  {
    section: "student-life",
    slug: "halls-of-residence",
    title: "Halls of Residence",
    summary: "The college's four halls of residence.",
    heroImage: img("administration-block"),
    blocks: [
      {
        id: id(),
        type: "cards",
        title: "",
        intro: "",
        columns: 4,
        items: [
          { title: "Annor Assemah Hall", text: "", imageUrl: "", url: "" },
          { title: "Addison Hall", text: "", imageUrl: "", url: "" },
          { title: "Nkrumah Hall", text: "", imageUrl: "", url: "" },
          { title: "Cooke Hall", text: "", imageUrl: "", url: "" },
        ],
      },
      {
        id: id(),
        type: "callout",
        tone: "info",
        title: "Hall allocation",
        text: "Students register for a hall of residence and bed through the Student Registration Portal (ESRP).",
      },
    ],
  },
  {
    section: "student-life",
    slug: "student-leadership",
    title: "Student Leadership",
    summary: "The Students' Representative Council (SRC) gives every student a voice.",
    body: p(
      "The SRC represents students in college governance, organises student activities and promotes the welfare of the student body. Executives are elected each academic year.",
    ),
    blocks: [{ id: id(), type: "people", title: "SRC executives", intro: "", group: "student_leadership", layout: "grid" }],
  },
  {
    section: "student-life",
    slug: "student-services",
    title: "Student Services",
    summary: "Facilities and support services that help students thrive.",
    blocks: [
      {
        id: id(),
        type: "cards",
        title: "",
        intro: "",
        columns: 3,
        items: [
          { title: "Library", text: "Books, journals and e-resources, online at library.enchicoe.edu.gh.", imageUrl: "", url: "https://library.enchicoe.edu.gh/" },
          { title: "College clinic", text: "Health services for students on campus.", imageUrl: "", url: "" },
          { title: "Guidance & counselling", text: "Career guidance and confidential counselling.", imageUrl: "", url: "" },
          { title: "Dining", text: "Local and continental dishes on campus.", imageUrl: "", url: "" },
          { title: "Campus Wi-Fi", text: "Free wireless internet across the campus.", imageUrl: "", url: "" },
          { title: "Sports facilities", text: "Facilities for inter-hall and inter-college sport.", imageUrl: "", url: "" },
          { title: "Banking & postal services", text: "Postal and banking facilities close at hand.", imageUrl: "", url: "" },
          { title: "Shops & printing", text: "Shops and printing services on campus.", imageUrl: "", url: "" },
          { title: "Enchicoe TV", text: "News and stories from the college.", imageUrl: "", url: "https://enchicoetv.com/" },
        ],
      },
    ],
  },

  // ---- Alumni --------------------------------------------------------------
  {
    section: "alumni",
    slug: "alumni-association",
    title: "Alumni Association",
    summary: "Old students of Enchi College of Education, teaching across Ghana and beyond.",
    heroImage: img("staff-assembly"),
    body: p(
      "The Alumni Association keeps old students connected with one another and with the college, supporting development projects, mentoring trainees and celebrating the achievements of Enchi alumni.",
    ),
    blocks: [
      { id: id(), type: "people", title: "Alumni executives", intro: "", group: "alumni_executive", layout: "grid" },
      { id: id(), type: "cta", title: "Stay connected", text: "Update your details and hear about reunions and projects.", buttonLabel: "Get in touch", buttonUrl: "/alumni/stay-connected", tone: "crest" },
    ],
  },
  {
    section: "alumni",
    slug: "transcript-request",
    title: "Transcript Request",
    summary: "Request and pay for your academic transcript online.",
    body: p(
      'Requests and payments for transcripts are made on the University of Ghana <a href="https://sts.ug.edu.gh/">Student Transcript Service (STS) portal</a>. Applicants can track the status of their request on the same portal. Transcripts marked as <strong>Completed</strong> are ready for pickup or have been sent to the email address requested.',
    ),
    blocks: [
      {
        id: id(),
        type: "cta",
        title: "Request a transcript",
        text: "Follow the University of Ghana's transcript request guide.",
        buttonLabel: "Request now",
        buttonUrl: "https://www.ug.edu.gh/aad/resources/academic-support-services/transcript-request",
        tone: "navy",
      },
    ],
  },
  {
    section: "alumni",
    slug: "give-to-enchicoe",
    title: "Give to ENCHICOE",
    summary: "Support the college — and the 1000-seater auditorium project.",
    heroImage: img("auditorium-sod-cutting"),
    blocks: [
      {
        id: id(),
        type: "imageText",
        title: "1000-Seater Capacity Auditorium Project",
        html: p(
          "On behalf of Enchi College of Education, we thank you for your generosity and support in bringing our 1000-seater auditorium to life. This space, born from shared dreams and community effort, will inspire learning, creativity and connection for generations. Thank you!",
        ),
        imageUrl: img("auditorium-sod-cutting"),
        imageAlt: "Sod-cutting for the auditorium project",
        imagePosition: "left",
      },
      { id: id(), type: "cta", title: "Make a contribution", text: "Contact the college to support the auditorium or other projects.", buttonLabel: "Contact us", buttonUrl: "/about/contact-us", tone: "crest" },
    ],
  },
  {
    section: "alumni",
    slug: "stay-connected",
    title: "Stay Connected",
    summary: "Send us your details or a message for the Alumni Association.",
    blocks: [{ id: id(), type: "contact", title: "Contact the alumni office", intro: "Tell us your year group, programme and current location.", showForm: true, showMap: false }],
  },
];

// The administrative units listed on the old site's Staff page. Heads named
// on its College Management page are filled in; the rest are placeholders.
interface UnitSeed {
  slug: string;
  name: string;
  summary: string;
  category: "office" | "unit" | "library";
  headName?: string;
  headTitle?: string;
  website?: string;
}

const UNITS: Array<UnitSeed> = [
  { slug: "office-of-the-principal", name: "Office of the Principal", summary: "Academic and administrative leadership of the college.", category: "office", headName: "Prof. Francis Kwaw Andoh", headTitle: "Principal" },
  { slug: "office-of-the-vice-principal", name: "Office of the Vice Principal", summary: "Supports the Principal in the leadership of the college.", category: "office", headName: "Dr. Emmanuel Adom Ahun", headTitle: "Vice Principal" },
  { slug: "secretariat", name: "Secretariat (Registry)", summary: "The college registry: records, correspondence and administration.", category: "office", headName: "Mr. Bright Korankye Appau", headTitle: "Ag. Registrar" },
  { slug: "academic-affairs", name: "Academic Affairs", summary: "Admissions, registration, examinations and academic records.", category: "unit" },
  { slug: "library", name: "College Library", summary: "Print and electronic resources for teaching and learning.", category: "library", headName: "Mr. Ronald Andoh-Kwaw", headTitle: "Ag. College Librarian", website: "https://library.enchicoe.edu.gh/" },
  { slug: "finance", name: "Finance", summary: "Fees, payments and the college's financial administration.", category: "unit", headName: "Mr. John Ndaah-Ackah Blay", headTitle: "Ag. Finance Officer" },
  { slug: "internal-audit", name: "Internal Audit", summary: "Independent assurance on the college's finances and controls.", category: "unit", headName: "Mr. Vincent Tarkyi", headTitle: "Ag. Internal Auditor" },
  { slug: "procurement", name: "Procurement", summary: "Purchasing of goods, works and services.", category: "unit" },
  { slug: "supply", name: "Supply Unit", summary: "Stores and the supply of materials across the college.", category: "unit" },
  { slug: "estate", name: "Estate", summary: "Buildings, grounds and maintenance.", category: "unit" },
  { slug: "quality-assurance", name: "Quality Assurance", summary: "Monitoring and improving the quality of teaching and services.", category: "unit" },
  { slug: "ict", name: "College I.T Unit (CITU)", summary: "Campus network, computer labs, the website and e-learning systems.", category: "unit" },
  { slug: "transport", name: "Transport", summary: "College vehicles and transport services.", category: "unit" },
  { slug: "sanitation-and-security", name: "Sanitation and Security", summary: "A clean, safe and secure campus.", category: "unit" },
  { slug: "kitchen", name: "Kitchen", summary: "Meals for students in the dining hall.", category: "unit" },
];

// unit: slug of the unit the person heads, linked for the staff directory.
const PEOPLE: Array<{ group: string; name: string; title: string; unit?: string; photo?: string }> = [
  { group: "principal_office", name: "Prof. Francis Kwaw Andoh", title: "Principal", unit: "office-of-the-principal", photo: img("principal") },
  { group: "principal_office", name: "Dr. Emmanuel Adom Ahun", title: "Vice Principal", unit: "office-of-the-vice-principal" },
  { group: "management", name: "Prof. Francis Kwaw Andoh", title: "Principal", unit: "office-of-the-principal", photo: img("principal") },
  { group: "management", name: "Dr. Emmanuel Adom Ahun", title: "Vice Principal", unit: "office-of-the-vice-principal" },
  { group: "management", name: "Mr. Bright Korankye Appau", title: "Ag. Registrar", unit: "secretariat" },
  { group: "management", name: "Mr. Ronald Andoh-Kwaw", title: "Ag. College Librarian", unit: "library" },
  { group: "management", name: "Mr. Vincent Tarkyi", title: "Ag. Internal Auditor", unit: "internal-audit" },
  { group: "management", name: "Mr. John Ndaah-Ackah Blay", title: "Ag. Finance Officer", unit: "finance" },
  { group: "student_leadership", name: "[SRC President]", title: "SRC President" },
  { group: "student_leadership", name: "[SRC Vice President]", title: "SRC Vice President" },
  { group: "student_leadership", name: "[SRC General Secretary]", title: "General Secretary" },
  { group: "alumni_executive", name: "[Alumni President]", title: "National President" },
  { group: "alumni_executive", name: "[Alumni Secretary]", title: "National Secretary" },
];

// Home page hero slides.
const SPOTLIGHTS = [
  {
    eyebrow: "Welcome to ENCHICOE",
    title: "Light Expels Darkness",
    caption: "Training quality, lifelong specialist teachers in the Western North Region since 1965.",
    image: img("campus-aerial"),
    ctaLabel: "Discover the college",
    ctaUrl: "/about/overview",
  },
  {
    eyebrow: "Admissions",
    title: "Begin your teaching career at Enchi",
    caption: "Bachelor of Education in Early Grade, Upper Primary and Junior High School Education.",
    image: img("matriculation-procession"),
    ctaLabel: "How to apply",
    ctaUrl: "/admissions/how-to-apply",
  },
  {
    eyebrow: "Recognition",
    title: "Best UG-affiliated College of Education, 2024",
    caption: "Named the overall best among the Colleges of Education affiliated to the University of Ghana.",
    image: img("administration-block"),
    ctaLabel: "Our achievements",
    ctaUrl: "/about/overview",
  },
  {
    eyebrow: "Campus life",
    title: "A vibrant community of student-teachers",
    caption: "Clinic, counselling, sports, dining and free Wi-Fi across the campus.",
    image: img("students-celebrating"),
    ctaLabel: "Explore campus life",
    ctaUrl: "/student-life/campus-life",
  },
];

const POSTS: Array<{ type: "news" | "event" | "announcement"; slug: string; title: string; excerpt: string; body: string; category: string; cover?: string }> = [
  {
    type: "news",
    slug: "welcome-to-our-new-website",
    title: "Welcome to our new college website",
    excerpt: "A new home online for news, events, admissions information and downloads from Enchi College of Education.",
    body: p(
      "We are pleased to launch the new Enchi College of Education website. Here you will find information about the college, our programmes and units, admissions, student life, the staff directory and the latest news, events and announcements.",
      "Forms, handbooks and calendars will be published on the Guides & Downloads page. We welcome your feedback through the Contact Us page.",
    ),
    category: "College News",
    cover: img("campus-aerial-2"),
  },
];

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error("DATABASE_URL is not set.");
  const db = await mysql.createConnection({ uri });
  let created = 0;

  for (const [index, page] of PAGES.entries()) {
    const [r] = await db.execute<mysql.ResultSetHeader>(
      `INSERT IGNORE INTO pages (section, slug, title, summary, hero_image_url, body, blocks, status, show_in_nav, sort_order, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        page.section,
        page.slug,
        page.title,
        page.summary,
        page.heroImage ?? null,
        page.body ?? null,
        JSON.stringify(page.blocks),
        page.draft ? "draft" : "published",
        index,
        page.draft ? null : new Date(),
      ],
    );
    created += r.affectedRows;
  }

  for (const [index, u] of UNITS.entries()) {
    const [r] = await db.execute<mysql.ResultSetHeader>(
      `INSERT IGNORE INTO departments (kind, directory_category, slug, name, summary, head_name, head_title, website_url, sort_order)
       VALUES ('unit', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.category, u.slug, u.name, u.summary, u.headName ?? "[Name of Head of Unit]", u.headTitle ?? "Head of Unit", u.website ?? null, index],
    );
    created += r.affectedRows;
  }

  // People and spotlights have no natural key, so only seed an empty table.
  const [[peopleCount]] = await db.query<mysql.RowDataPacket[]>("SELECT COUNT(*) AS n FROM people");
  if (Number(peopleCount?.n) === 0) {
    const [units] = await db.query<mysql.RowDataPacket[]>("SELECT id, slug FROM departments WHERE kind = 'unit'");
    const unitId = new Map(units.map((u) => [u.slug as string, u.id as number]));
    for (const [index, person] of PEOPLE.entries()) {
      await db.execute("INSERT INTO people (group_key, name, title, department_id, photo_url, sort_order) VALUES (?, ?, ?, ?, ?, ?)", [
        person.group,
        person.name,
        person.title,
        (person.unit && unitId.get(person.unit)) ?? null,
        person.photo ?? null,
        index,
      ]);
      created++;
    }
  }

  const [[spotlightCount]] = await db.query<mysql.RowDataPacket[]>("SELECT COUNT(*) AS n FROM spotlights");
  if (Number(spotlightCount?.n) === 0) {
    for (const [index, s] of SPOTLIGHTS.entries()) {
      await db.execute(
        "INSERT INTO spotlights (eyebrow, title, caption, image_url, cta_label, cta_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [s.eyebrow, s.title, s.caption, s.image, s.ctaLabel, s.ctaUrl, index],
      );
      created++;
    }
  }

  for (const post of POSTS) {
    const [r] = await db.execute<mysql.ResultSetHeader>(
      `INSERT IGNORE INTO posts (type, slug, title, excerpt, body, category, cover_image_url, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'published', NOW())`,
      [post.type, post.slug, post.title, post.excerpt, post.body, post.category, post.cover ?? null],
    );
    created += r.affectedRows;
  }

  console.log(created ? `Seeded ${created} new rows of starter content.` : "Starter content already present — nothing to do.");
  console.log("Next: npm run directory:backfill -w apps/web  (links management to staff directory profiles)");
  await db.end();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
