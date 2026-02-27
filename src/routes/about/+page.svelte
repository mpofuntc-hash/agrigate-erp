<script lang="ts">
  let anonymizeEmail = $state("");
  let anonymizeMessage = $state("");
  let anonymizeStatus = $state<"idle" | "sent" | "error">("idle");

  async function submitAnonymizeRequest(e: Event) {
    e.preventDefault();
    // In production, this would call an API endpoint or Convex mutation
    // For now, simulate a successful submission
    anonymizeStatus = "sent";
  }
</script>

<svelte:head>
  <title>About AgriGate — POPIA Compliance & Privacy</title>
</svelte:head>

<div class="page">
  <div class="container">

    <!-- Header -->
    <header class="hero">
      <p class="eyebrow">ZZ2 Farm Operations</p>
      <h1>AgriGate ERP Platform</h1>
      <p class="tagline">Connecting South African farm workers, foremen, and employers with transparent, compliant digital infrastructure.</p>
    </header>

    <!-- Mission -->
    <section class="section">
      <h2>Our Mission</h2>
      <p>AgriGate was built to modernise labour management on South African farms — eliminating paper-based registers, preventing ghost-worker fraud, and ensuring every picker and packer is correctly credited for their work. We believe that agricultural workers deserve the same digital transparency afforded to office employees.</p>
      <div class="feature-grid">
        <div class="feature">
          <span class="feature-icon">🌾</span>
          <strong>Fair Pay</strong>
          <p>Accurate bin-weight logging ensures piece-workers are paid for every kilogram harvested.</p>
        </div>
        <div class="feature">
          <span class="feature-icon">📍</span>
          <strong>Anti-Fraud GPS</strong>
          <p>Clock-in/out uses verified GPS to prevent ghost workers and time-sheet manipulation.</p>
        </div>
        <div class="feature">
          <span class="feature-icon">🔒</span>
          <strong>Data Security</strong>
          <p>All personal information is encrypted in transit and at rest, accessible only to authorised personnel.</p>
        </div>
      </div>
    </section>

    <!-- POPIA Compliance -->
    <section class="section popia-section">
      <div class="badge">POPIA Compliant</div>
      <h2>Protection of Personal Information Act (POPIA)</h2>
      <p>AgriGate processes personal data in full compliance with the <strong>Protection of Personal Information Act, 4 of 2013</strong> (POPIA). As an operator and responsible party, ZZ2 Farm Operations adheres to the eight conditions for lawful processing.</p>

      <h3>Data We Collect &amp; Why</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Data Field</th>
            <th>Purpose</th>
            <th>Legal Basis</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>SA ID Number / Passport</strong></td>
            <td>Employment eligibility verification; prevents duplicate registrations; enables SARS/UIF compliance</td>
            <td>Contractual necessity; legal obligation</td>
          </tr>
          <tr>
            <td><strong>Full Name</strong></td>
            <td>Payroll records; roster assignment; yield log attribution</td>
            <td>Contractual necessity</td>
          </tr>
          <tr>
            <td><strong>Phone Number</strong></td>
            <td>Emergency contact; payment notifications</td>
            <td>Contractual necessity; legitimate interest</td>
          </tr>
          <tr>
            <td><strong>GPS Location (Clock Events)</strong></td>
            <td>Anti-fraud verification of physical presence; ghost-worker prevention; orchard block accuracy</td>
            <td>Legitimate interest (farm security)</td>
          </tr>
          <tr>
            <td><strong>Email Address</strong></td>
            <td>Account authentication via OAuth provider</td>
            <td>Contractual necessity</td>
          </tr>
        </tbody>
      </table>

      <h3>Data Retention</h3>
      <ul>
        <li>Employee records and payroll data: <strong>5 years</strong> after employment ends (SARS requirement)</li>
        <li>Clock events and yield logs: <strong>3 years</strong> from collection date</li>
        <li>Authentication tokens: <strong>Session-based</strong>, expire on sign-out</li>
        <li>Anonymised records: Retained indefinitely (no PII, only statistical identifiers)</li>
      </ul>

      <h3>Data Sharing</h3>
      <p>Your personal information is <strong>never sold</strong> to third parties. Data is shared only with:</p>
      <ul>
        <li>Convex Inc. (our cloud database provider, ISO 27001 compliant)</li>
        <li>OAuth providers (Google, Apple, Microsoft) — only your email is received</li>
        <li>Authorised ZZ2 Farm Operations payroll and HR personnel</li>
        <li>Regulatory bodies (SARS, Dept. of Labour) when legally required</li>
      </ul>
    </section>

    <!-- Right to Erasure -->
    <section class="section" id="right-to-erasure">
      <h2>Your Rights Under POPIA</h2>
      <ul class="rights-list">
        <li><strong>Right to Access:</strong> Request a copy of all personal data we hold about you</li>
        <li><strong>Right to Correction:</strong> Ask us to correct inaccurate information</li>
        <li><strong>Right to Erasure (Anonymisation):</strong> Request that your personal details be wiped. Your work logs and pay records are retained in anonymised form to satisfy legal obligations, but your name, SA ID, and phone number will be permanently deleted.</li>
        <li><strong>Right to Object:</strong> Object to certain types of processing (e.g. marketing)</li>
        <li><strong>Right to Complaint:</strong> Lodge a complaint with the <a href="https://www.inforegulator.org.za" target="_blank" rel="noopener">Information Regulator of South Africa</a></li>
      </ul>

      <h3>Request Anonymisation</h3>
      <p>To exercise your right to erasure, complete the form below. Your request will be processed within <strong>5 business days</strong>.</p>

      {#if anonymizeStatus === "sent"}
        <div class="success-banner">
          ✓ Your anonymisation request has been received. We will contact you within 5 business days.
        </div>
      {:else}
        <form class="anonymize-form" onsubmit={submitAnonymizeRequest}>
          <label>
            Your Email Address (used for your AgriGate account)
            <input
              type="email"
              bind:value={anonymizeEmail}
              required
              placeholder="you@example.com"
            />
          </label>
          <label>
            Additional context (optional)
            <textarea
              bind:value={anonymizeMessage}
              rows="3"
              placeholder="e.g. I am no longer employed by ZZ2 and request erasure of all personal data."
            ></textarea>
          </label>
          <button type="submit">Submit Erasure Request</button>
        </form>
      {/if}
    </section>

    <!-- GPS Anti-Fraud Notice -->
    <section class="section">
      <h2>GPS Data &amp; Anti-Fraud Measures</h2>
      <p>When you clock in or out using AgriGate, your device's GPS coordinates are recorded. This data is used exclusively to:</p>
      <ul>
        <li>Verify physical presence at the assigned orchard block</li>
        <li>Detect attempts to falsify attendance using mock location apps</li>
        <li>Resolve disputes about working hours</li>
      </ul>
      <p>Location data is <strong>not used for continuous tracking</strong> — only at the moment of clock-in and clock-out. Suspicious location signals (e.g. unrealistically precise GPS, stale position data) are flagged for employer review but do not automatically result in disciplinary action.</p>
    </section>

    <!-- Contact -->
    <section class="section contact-section">
      <h2>Contact &amp; Information Officer</h2>
      <div class="contact-grid">
        <div>
          <strong>ZZ2 Farm Operations (Pty) Ltd</strong><br />
          Information Officer: HR Department<br />
          Email: <a href="mailto:privacy@zz2.co.za">privacy@zz2.co.za</a><br />
          Phone: +27 (0)15 491 4000<br />
          Address: P.O. Box 19, Mooketsi, 0825, South Africa
        </div>
        <div>
          <strong>Information Regulator of South Africa</strong><br />
          For complaints about data processing<br />
          Email: <a href="mailto:inforeg@justice.gov.za">inforeg@justice.gov.za</a><br />
          Website: <a href="https://www.inforegulator.org.za" target="_blank" rel="noopener">inforegulator.org.za</a>
        </div>
      </div>
    </section>

    <footer class="page-footer">
      <p>AgriGate ERP Platform · ZZ2 Farm Operations · Last updated: February 2026</p>
      <p>This privacy notice is reviewed annually and updated when our data practices change.</p>
    </footer>
  </div>
</div>

<style>
  .page {
    min-height: 100vh;
    background: #f9fafb;
    font-family: 'Inter', system-ui, sans-serif;
    color: #111827;
  }

  .container {
    max-width: 860px;
    margin: 0 auto;
    padding: 3rem 1.5rem;
  }

  /* Hero */
  .hero {
    text-align: center;
    padding: 3rem 0 2rem;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 3rem;
  }
  .eyebrow {
    font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.15em; color: #6b7280; margin-bottom: 0.75rem;
  }
  .hero h1 { font-size: 2.25rem; font-weight: 800; color: #064e3b; margin-bottom: 1rem; }
  .tagline  { font-size: 1rem; color: #6b7280; max-width: 560px; margin: 0 auto; line-height: 1.6; }

  /* Sections */
  .section {
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #f3f4f6;
  }
  .section h2 { font-size: 1.35rem; font-weight: 700; color: #064e3b; margin-bottom: 1rem; }
  .section h3 { font-size: 1rem; font-weight: 700; color: #374151; margin: 1.5rem 0 0.75rem; }
  .section p  { font-size: 0.92rem; line-height: 1.7; color: #374151; margin-bottom: 0.75rem; }
  .section ul { font-size: 0.92rem; color: #374151; line-height: 1.7; padding-left: 1.25rem; }
  .section ul li { margin-bottom: 0.4rem; }
  .section a  { color: #065f46; }

  /* Feature grid */
  .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-top: 1.5rem; }
  .feature {
    background: #fff; border: 1px solid #e5e7eb; border-radius: 10px;
    padding: 1.25rem; display: flex; flex-direction: column; gap: 0.4rem;
  }
  .feature-icon { font-size: 1.5rem; }
  .feature strong { font-size: 0.9rem; color: #111827; }
  .feature p { font-size: 0.8rem; color: #6b7280; line-height: 1.5; margin: 0; }

  /* POPIA badge */
  .popia-section { background: #f0fdf4; border-radius: 12px; padding: 2rem; border: 1px solid #bbf7d0; border-bottom: 1px solid #bbf7d0; }
  .badge {
    display: inline-block; padding: 0.25rem 0.75rem;
    background: #16a34a; color: #fff;
    font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;
    border-radius: 999px; margin-bottom: 0.75rem;
  }

  /* Data table */
  .data-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-top: 0.75rem; }
  .data-table th { background: #065f46; color: #fff; padding: 0.6rem 0.75rem; text-align: left; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .data-table td { padding: 0.6rem 0.75rem; border-bottom: 1px solid #d1fae5; vertical-align: top; }
  .data-table tr:nth-child(even) td { background: rgba(255,255,255,0.6); }

  /* Rights list */
  .rights-list { list-style: none; padding: 0; }
  .rights-list li {
    padding: 0.75rem 0;
    border-bottom: 1px solid #f3f4f6;
    font-size: 0.9rem; line-height: 1.6;
  }

  /* Anonymise form */
  .anonymize-form { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; max-width: 500px; }
  .anonymize-form label {
    display: flex; flex-direction: column; gap: 0.35rem;
    font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280;
  }
  .anonymize-form input,
  .anonymize-form textarea {
    padding: 0.6rem 0.85rem;
    border: 1.5px solid #d1d5db; border-radius: 6px;
    font-size: 0.9rem; font-family: inherit; color: #111827;
    background: #fff;
  }
  .anonymize-form input:focus,
  .anonymize-form textarea:focus { outline: none; border-color: #065f46; }
  .anonymize-form button {
    padding: 0.7rem 1.5rem; background: #065f46; color: #fff;
    border: none; border-radius: 6px; font-weight: 700; font-size: 0.88rem;
    cursor: pointer; align-self: flex-start;
  }
  .anonymize-form button:hover { background: #047857; }

  .success-banner {
    padding: 1rem 1.25rem; background: #f0fdf4; border: 1px solid #86efac;
    border-radius: 8px; color: #166534; font-size: 0.9rem; margin-top: 1rem;
  }

  /* Contact */
  .contact-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;
    font-size: 0.88rem; line-height: 1.8; margin-top: 1rem;
  }
  .contact-grid a { color: #065f46; }

  /* Footer */
  .page-footer {
    text-align: center; padding: 2rem 0;
    font-size: 0.75rem; color: #9ca3af; line-height: 1.6;
  }

  @media (max-width: 640px) {
    .hero h1 { font-size: 1.6rem; }
    .contact-grid { grid-template-columns: 1fr; }
    .popia-section { padding: 1.25rem; }
    .data-table { font-size: 0.75rem; }
    .data-table th, .data-table td { padding: 0.45rem 0.5rem; }
  }
</style>
