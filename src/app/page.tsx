import CommentOverlay from "@/components/CommentOverlay";
import OwnerPanel from "@/components/OwnerPanel";

export default function Page() {
  return (
    <main className="relative">
      {/* Global comment layer lives above everything */}
      <CommentOverlay />
      <OwnerPanel />
      {/* Title */}
      <section className="mx-auto max-w-4xl px-6 pt-20 pb-8 text-center">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
          Design advocacy as continuous narrative negotiation
        </h1>
      </section>

      {/* Instruction box */}
      <section className="mx-auto max-w-2xl px-6 pb-16">
        <div className="rounded-xl border border-neutral-300 bg-white p-4 text-sm text-neutral-700 shadow-sm">
          <p className="mb-1 font-medium text-neutral-900">How to comment</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Right-click anywhere to place a pin and write a short note.</li>
            <li>Drag the note to reposition. Click ✓ to save. Use … to edit later.</li>
            <li>Your notes are visible to the author; not to other reviewers.</li>
          </ul>
        </div>
      </section>

      {/* “Context” block */}
      <section id="context" className="mx-auto max-w-5xl px-6 pb-16">
        <div className="rounded-2xl bg-neutral-100 border border-neutral-300 p-8">
          <div className="text-3xl font-medium tracking-wide mb-6 text-neutral-900">CONTEXT</div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2 text-neutral-900">Organisational Position of Design</h3>
              <p className="text-neutral-700">Explores how design’s placement… influence and visibility.</p>
              <p className="text-neutral-500 mt-2 text-sm">12/15</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-neutral-900">Internal Stakeholders and Audiences</h3>
              <p className="text-neutral-700">Identifies whom advocacy targets… expectations and resistance vary.</p>
              <p className="text-neutral-500 mt-2 text-sm">9/15</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-neutral-900">Nature of Advocacy Work</h3>
              <p className="text-neutral-700">Advocacy as continuous sense-making… uneven literacy levels.</p>
              <p className="text-neutral-500 mt-2 text-sm">7/15</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-neutral-900">Constraints and Enablers</h3>
              <p className="text-neutral-700">Legacy mindsets, silos, speed culture vs sponsorship and growth.</p>
              <p className="text-neutral-500 mt-2 text-sm">9/15</p>
            </div>
          </div>
        </div>
      </section>

      {/* “WHAT” / Value lenses + supporting themes */}
      <section id="what" className="mx-auto max-w-5xl px-6 pb-16">
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-8">
          <div className="text-center text-neutral-600 tracking-wider mb-6">“WHAT”</div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2 text-neutral-900">Design as Connection to Customer</h3>
              <p className="text-neutral-700">Design represents the customer voice…</p>
              <p className="text-neutral-500 mt-2 text-sm">13/15</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-neutral-900">Design as Integrator and Efficiency Enabler</h3>
              <p className="text-neutral-700">Bridges silos and reduces waste…</p>
              <p className="text-neutral-500 mt-2 text-sm">12/15</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-neutral-900">Design as Differentiator and Quality Standard</h3>
              <p className="text-neutral-700">Drives superior experience and distinction…</p>
              <p className="text-neutral-500 mt-2 text-sm">10/15</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-neutral-900">Design as Strategic Lens and Vision Caster</h3>
              <p className="text-neutral-700">Extends design into foresight and innovation…</p>
              <p className="text-neutral-500 mt-2 text-sm">9/15</p>
            </div>
          </div>

          <div className="mt-8 text-center text-neutral-600">SUPPORTING THEMES</div>
          <div className="mt-4 grid md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold mb-1 text-neutral-900">Consistency through Design Systems</h4>
              <p className="text-neutral-700 text-sm">Consistency as a foundation for value at scale.</p>
              <p className="text-neutral-500 mt-2 text-sm">4/15</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1 text-neutral-900">Culture Change and Evangelism</h4>
              <p className="text-neutral-700 text-sm">Leaders act as educators, embedding design thinking.</p>
              <p className="text-neutral-500 mt-2 text-sm">7/15</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1 text-neutral-900">Creativity as a Sustaining Resource</h4>
              <p className="text-neutral-700 text-sm">Creative imagination sustains renewal.</p>
              <p className="text-neutral-500 mt-2 text-sm">4/15</p>
            </div>
          </div>
        </div>
      </section>

      {/* “HOW” */}
      <section id="how" className="mx-auto max-w-5xl px-6 pb-28">
        <div className="rounded-2xl bg-fuchsia-50 border border-fuchsia-200 p-8">
          <div className="text-left md:text-center text-neutral-600 tracking-wider mb-6">“HOW”</div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              ["Tangible Demonstration and ‘Show, Don’t Tell’", "Leaders favour showing results…", "13/15"],
              ["Prototypes and Artifacts", "Prototypes and visuals clarify ideas…", "11/15"],
              ["Translating Design into Business", "Adapt vocabulary to metrics and priorities.", "9/15"],
              ["Metrics and External Legitimacy", "Outcomes tied to indicators and benchmarks.", "8/15"],
              ["Participation and Small Wins", "Workshops/pilots create quick progress.", "10/15"],
              ["Sustained Advocacy and Repetition", "Ongoing communication and showcases.", "9/15"],
            ].map(([title, desc, score]) => (
              <div key={title as string}>
                <h4 className="font-semibold mb-1 text-neutral-900">{title}</h4>
                <p className="text-neutral-700 text-sm">{desc}</p>
                <p className="text-neutral-500 mt-2 text-sm">{score}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-5xl px-6 pb-10 text-xs text-neutral-500">
        © {new Date().getFullYear()} — Thesis findings. Contact: your@email
      </footer>
    </main>
  );
}
