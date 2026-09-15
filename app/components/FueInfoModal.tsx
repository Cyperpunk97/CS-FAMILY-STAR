'use client';

import Image from 'next/image';
import {
  Award,
  BookOpen,
  Building2,
  CheckCircle2,
  Compass,
  ExternalLink,
  GraduationCap,
  HeartHandshake,
  Landmark,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import Modal from './Modal';

interface FueInfoModalProps {
  open: boolean;
  onClose: () => void;
  onSelectFaculty?: (facultyId: string) => void;
}

interface FacultyInfo {
  id: string;
  name: string;
  shortName: string;
  building: string;
  arabicName: string;
  degree: string;
  highlight: string;
  iconName: string;
}

const FACULTIES_DATA: FacultyInfo[] = [
  {
    id: 'fcit-cs',
    name: 'Faculty of Computers and Information Technology',
    shortName: 'CS & IT',
    arabicName: 'كلية الحاسبات وتكنولوجيا المعلومات',
    building: 'Building 1 (North-West Wing)',
    degree: 'B.Sc. in Computer Science, AI, & Information Systems',
    highlight: 'Home to our CS Family Star community, advanced software labs & AI research.',
    iconName: '💻',
  },
  {
    id: 'engineering',
    name: 'Faculty of Engineering and Technology',
    shortName: 'Engineering',
    arabicName: 'كلية الهندسة والتكنولوجيا',
    building: 'Building 2 (West Wing)',
    degree: 'B.Sc. in Architectural, Civil, Electrical, & Mechanical Eng.',
    highlight: 'Cutting-edge engineering workshops, design studios, and mechatronics labs.',
    iconName: '⚙️',
  },
  {
    id: 'pharmacy',
    name: 'Faculty of Pharmacy',
    shortName: 'Pharmacy',
    arabicName: 'كلية الصيدلة',
    building: 'Building 3 (East Wing)',
    degree: 'PharmD & Clinical Pharmacy Degrees',
    highlight: 'Advanced pharmacology research centers, medicinal chemistry, and simulated dispensary.',
    iconName: '💊',
  },
  {
    id: 'dental',
    name: 'Faculty of Oral and Dental Medicine',
    shortName: 'Dental Medicine',
    arabicName: 'كلية طب الفم والأسنان',
    building: 'Building 4 & FUE Specialized Dental Hospital',
    degree: 'B.D.S. in Oral and Dental Surgery',
    highlight: 'Features the on-campus FUE Dental Hospital providing real-world clinical training.',
    iconName: '🦷',
  },
  {
    id: 'business',
    name: 'Faculty of Commerce and Business Administration',
    shortName: 'Commerce & Business',
    arabicName: 'كلية التجارة وإدارة الأعمال',
    building: 'Building 5 (South Wing)',
    degree: 'B.Sc. in Finance, Marketing, Accounting, & Management',
    highlight: 'Financial market simulations, entrepreneurship incubators, and corporate partnerships.',
    iconName: '📊',
  },
  {
    id: 'economics',
    name: 'Faculty of Economics and Political Science',
    shortName: 'Economics & Politics',
    arabicName: 'كلية الاقتصاد والعلوم السياسية',
    building: 'Building 6 (South-East Wing)',
    degree: 'B.Sc. in Political Science, Economics, & Public Administration',
    highlight: 'Diplomatic study centers, public policy forums, and Model United Nations.',
    iconName: '🌐',
  },
];

export default function FueInfoModal({ open, onClose, onSelectFaculty }: FueInfoModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Future University in Egypt"
      bareHeader
      size="xl"
      variant="dialog"
    >
      <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-2xl bg-surface text-ink">
        {/* Top Header Hero with FUE Brand Identity */}
        <div className="relative overflow-hidden border-b border-hairline/80 bg-gradient-to-br from-[#071b30] via-[#0b2545] to-[#123863] px-6 py-6 text-white sm:px-8">
          {/* Subtle geometric background pattern */}
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-red-600/10 blur-2xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-blue-500/15 blur-2xl"
            aria-hidden="true"
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-lg shadow-black/20 ring-2 ring-white/20">
                <Image
                  src="/logos/fue-logo.png"
                  alt="Future University in Egypt Logo"
                  width={56}
                  height={64}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-red-600/90 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs">
                    Est. 2006
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 ring-1 ring-amber-400/30">
                    <Sparkles className="h-2.5 w-2.5" />
                    QS 5 Stars Rated
                  </span>
                  <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-200 ring-1 ring-blue-400/30">
                    Accredited
                  </span>
                </div>

                <h2 className="mt-1.5 text-xl font-black tracking-tight text-white sm:text-2xl">
                  Future University in Egypt
                </h2>
                <p className="text-xs font-semibold text-blue-200/90">
                  جامعة المستقبل بمصر · New Cairo, Egypt
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick stats pills */}
          <div className="mt-5 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 backdrop-blur-xs ring-1 ring-white/10">
              <Landmark className="h-4 w-4 text-amber-400 shrink-0" />
              <div>
                <span className="block text-[10px] font-medium text-blue-200/70">Founded</span>
                <span className="font-bold text-white">Decree 254/2006</span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 backdrop-blur-xs ring-1 ring-white/10">
              <GraduationCap className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <span className="block text-[10px] font-medium text-blue-200/70">Faculties</span>
                <span className="font-bold text-white">6 Accredited</span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 backdrop-blur-xs ring-1 ring-white/10">
              <MapPin className="h-4 w-4 text-red-400 shrink-0" />
              <div>
                <span className="block text-[10px] font-medium text-blue-200/70">Location</span>
                <span className="font-bold text-white">New Cairo (90th St)</span>
              </div>
            </div>

            <a
              href="https://www.fue.edu.eg/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-xl bg-red-600/90 px-3 py-2 font-bold text-white shadow-sm transition hover:bg-red-500"
            >
              <div className="truncate">
                <span className="block text-[10px] font-medium text-red-100">Official Portal</span>
                <span className="truncate">fue.edu.eg</span>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
          {/* Section 1: About FUE */}
          <section className="rounded-2xl border border-hairline bg-card p-5 shadow-xs">
            <div className="flex items-center gap-2 text-brand-900">
              <ShieldCheck className="h-5 w-5 text-red-700" />
              <h3 className="text-base font-extrabold uppercase tracking-wide text-ink">
                About FUE
              </h3>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Future University in Egypt (FUE) affirms a commitment to{' '}
              <strong className="font-bold text-ink">
                “an atmosphere that values intellectual curiosity and the pursuit of knowledge while
                preserving academic freedom and integrity”
              </strong>
              . FUE is thus committed to creating environments where freedom of inquiry occurs in a
              climate of inclusiveness and civility. Central to this commitment is the principle of
              treating each member of the University community fairly and with respect. To encourage
              such behavior, FUE prohibits discrimination, disrespect, and harassment and provides
              equal opportunities for all community members regardless of their race, color,
              religion, ethnic origin, ancestry, medical condition, marital status, gender, or age.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-ink-soft">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-800 ring-1 ring-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Academic Freedom & Integrity
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-blue-800 ring-1 ring-blue-200">
                <HeartHandshake className="h-3.5 w-3.5 text-blue-600" /> Inclusiveness & Civility
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-amber-800 ring-1 ring-amber-200">
                <Award className="h-3.5 w-3.5 text-amber-600" /> Equal Opportunity
              </span>
            </div>
          </section>

          {/* Section 2: Introducing Future University in Egypt */}
          <section className="rounded-2xl border border-hairline bg-card p-5 shadow-xs">
            <div className="flex items-center gap-2 text-brand-900">
              <Building2 className="h-5 w-5 text-brand-700" />
              <h3 className="text-base font-extrabold uppercase tracking-wide text-ink">
                Introducing Future University in Egypt
              </h3>
            </div>

            <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft">
              <p>
                We are one of the prominent private universities in Egypt. Founded in 2006, by the{' '}
                <strong className="font-bold text-ink">Presidential Decree 254/2006</strong> according
                to law number 101/1992 and executive regulations 219/2002, Future University in Egypt
                is a leading private university strategically located in the heart of New Cairo.
              </p>
              <p>
                FUE is dedicated to <strong className="font-bold text-ink">excellence in teaching, research & service</strong>.
                FUE is an educational institute committed to distinction, innovation and quality
                standards. FUE’s priority is to stay abreast with the national, regional and
                international changes taking place in the interrelated fields of education,
                scientific research and community development, while consolidating values and
                professional ethics.
              </p>
              <p className="border-l-2 border-brand-500 pl-3 italic text-ink font-medium">
                “We provide a creative, nurturing campus environment where our students can realize
                their potential, can learn from the best and most talented faculty staff, and can go
                on to make a positive difference after they graduate. We offer a rich and rewarding
                educational experience to all who choose to focus on excellence.”
              </p>
            </div>
          </section>

          {/* Section 3: FUTURE UNIVERSITY’S SIX FACULTIES */}
          <section className="rounded-2xl border border-hairline bg-card p-5 shadow-xs">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-brand-900">
                <GraduationCap className="h-5 w-5 text-red-700" />
                <h3 className="text-base font-extrabold uppercase tracking-wide text-ink">
                  Future University’s Six Faculties
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 self-start rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Accredited by Supreme Council
              </span>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Future University’s six faculties are fully accredited by the{' '}
              <strong className="font-bold text-ink">Supreme Council of Universities</strong>. A faculty
              is where students pursue their major area of study. They will experience teaching
              sessions (lectures), labs and tutorials. FUE campus is currently comprised of the
              following six faculties. Each faculty is an independent institution with its own property
              and equipment, responsible for selecting students in accordance with university
              regulations. Degrees are awarded by the university.
            </p>

            {/* Interactive list of faculties */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FACULTIES_DATA.map((fac) => (
                <div
                  key={fac.id}
                  className="group flex flex-col justify-between rounded-xl border border-hairline/80 bg-surface-sunken/40 p-3.5 transition hover:border-brand-300 hover:bg-surface hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl" role="img" aria-label={fac.shortName}>
                          {fac.iconName}
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-ink group-hover:text-brand-900">
                            {fac.name}
                          </h4>
                          <span className="text-[11px] font-medium text-ink-faint">
                            {fac.arabicName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 space-y-1 text-xs">
                      <p className="flex items-center gap-1.5 text-ink-soft">
                        <Building2 className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                        <span>{fac.building}</span>
                      </p>
                      <p className="text-[11px] text-ink-faint leading-snug">
                        {fac.highlight}
                      </p>
                    </div>
                  </div>

                  {onSelectFaculty && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectFaculty(fac.id);
                        onClose();
                      }}
                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 transition hover:text-brand-900"
                    >
                      <Compass className="h-3 w-3" />
                      <span>Set as walking origin & view food spots</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: FUTURE UNIVERSITY IN EGYPT STAFF */}
          <section className="rounded-2xl border border-hairline bg-card p-5 shadow-xs">
            <div className="flex items-center gap-2 text-brand-900">
              <Users className="h-5 w-5 text-brand-700" />
              <h3 className="text-base font-extrabold uppercase tracking-wide text-ink">
                Future University in Egypt Staff
              </h3>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              While ensuring our facilities are the best in Egypt, Future University in Egypt
              leadership knows that <strong className="font-bold text-ink">people are the key to academic excellence</strong>.
              It is our staff who truly create a vibrant intellectual community for our students.
              This is why FUE seeks out diverse, highly qualified and dedicated faculty and staff
              from around the world. We have both local and international staff members; many of them
              have completed their postgraduate studies abroad and bring with them a wide perspective
              to their field of specialization.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-hairline/60 bg-surface-sunken/40 p-3 text-center">
                <span className="text-lg">🌍</span>
                <h5 className="mt-1 text-xs font-bold text-ink">Global Perspective</h5>
                <p className="mt-0.5 text-[11px] text-ink-soft">
                  Staff trained in top international universities
                </p>
              </div>
              <div className="rounded-xl border border-hairline/60 bg-surface-sunken/40 p-3 text-center">
                <span className="text-lg">🔬</span>
                <h5 className="mt-1 text-xs font-bold text-ink">Research Leadership</h5>
                <p className="mt-0.5 text-[11px] text-ink-soft">
                  Dedicated faculty research centers & labs
                </p>
              </div>
              <div className="rounded-xl border border-hairline/60 bg-surface-sunken/40 p-3 text-center">
                <span className="text-lg">💡</span>
                <h5 className="mt-1 text-xs font-bold text-ink">Mentorship</h5>
                <p className="mt-0.5 text-[11px] text-ink-soft">
                  Nurturing talent from orientation to graduation
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Campus Life & Dining Connection */}
          <section className="rounded-2xl border border-brand-200/80 bg-brand-50/50 p-5 shadow-xs">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-extrabold text-brand-950">
                  Campus Life & CS Family Star Food Guide
                </h4>
                <p className="mt-1 text-xs text-brand-900/80">
                  Explore on-campus dining spots at the FUE Student Food Court and Plaza, check real
                  student reviews, and get customized walking times from any of FUE’s 6 faculty
                  buildings.
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-brand-700 shrink-0" />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-brand-200/60 pt-3 text-xs">
              <span className="font-semibold text-brand-900">
                End of 90th Street North, New Cairo, Egypt
              </span>
              <a
                href="https://www.fue.edu.eg/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-3 py-1.5 font-bold text-white shadow-xs transition hover:bg-brand-800"
              >
                <span>Visit fue.edu.eg</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-hairline/80 bg-surface-sunken/60 px-6 py-3 sm:px-8">
          <p className="text-xs text-ink-faint">
            Future University in Egypt (FUE) · Institutional Information
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-card px-4 py-1.5 text-xs font-bold text-ink shadow-xs ring-1 ring-hairline transition hover:bg-surface active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
