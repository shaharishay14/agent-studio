import { LegalPage } from '../../sky/LegalPage';

function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy" accent="Policy" subtitle="Template policy for self-hosted deployments of Agent Studio.">
      {/* Introduction */}
      <div className="space-y-4 text-[15px] leading-[25px] text-white/80">
        <p>
          This Privacy Policy explains how this Agent Studio deployment (the "Service") collects,
          uses, and protects your data. "We", "us", and "our" refer to the operator of this
          deployment.
        </p>
        <p>
          Agent Studio is an open-source project. If you run your own instance, you are the
          operator and should adapt this policy to reflect the providers you use and the laws that
          apply to you.
        </p>
      </div>

      {/* Section 1 */}
      <section className="space-y-4">
        <h2 className="font-display text-[22px] leading-7 font-medium tracking-[-0.02em] text-white">1. Information We Collect</h2>

        {/* 1.1 */}
        <div className="space-y-3 mt-4">
          <h3 className="text-[17px] font-semibold text-white">1.1 Account Information</h3>
          <ul className="flex list-disc flex-col gap-2 ps-5 text-[15px] leading-[25px] text-white/80 marker:text-white/40">
            <li>Name and email address</li>
            <li>Authentication details (password hash or OAuth sign-in)</li>
            <li>Profile settings and preferences</li>
          </ul>
        </div>

        {/* 1.2 */}
        <div className="space-y-3 mt-4">
          <h3 className="text-[17px] font-semibold text-white">1.2 User Content</h3>
          <ul className="flex list-disc flex-col gap-2 ps-5 text-[15px] leading-[25px] text-white/80 marker:text-white/40">
            <li>Prompts, agents, workflows, and triggers you create</li>
            <li>Files you upload</li>
            <li>Conversation history with your agents</li>
            <li>Execution logs and outputs</li>
          </ul>
        </div>

        {/* 1.3 */}
        <div className="space-y-3 mt-4">
          <h3 className="text-[17px] font-semibold text-white">1.3 Usage Data</h3>
          <p className="text-[15px] leading-[25px] text-white/80">
            Basic technical data such as feature usage, timestamps, error logs, IP address, and
            browser or device information, used for reliability and debugging.
          </p>
        </div>

        {/* 1.4 */}
        <div className="space-y-3 mt-4">
          <h3 className="text-[17px] font-semibold text-white">1.4 Integration Data</h3>
          <p className="text-[15px] leading-[25px] text-white/80">
            When you connect a third-party service (for example email, calendar, messaging, or code
            hosting), data from that service is processed only as needed for the agents and
            workflows you configure. Connection authorization is handled through an integration
            provider rather than stored as plain-text credentials.
          </p>
        </div>

        {/* 1.5 */}
        <div className="space-y-3 mt-4">
          <h3 className="text-[17px] font-semibold text-white">1.5 Approvals & Automation Settings</h3>
          <p className="text-[15px] leading-[25px] text-white/80">
            Approvals you grant to agents, automation settings, and related preferences are stored
            so the Service can run automated actions as you configured them.
          </p>
        </div>

        {/* 1.6 */}
        <div className="space-y-3 mt-4">
          <h3 className="text-[17px] font-semibold text-white">1.6 Cookies & Local Storage</h3>
          <p className="text-[15px] leading-[25px] text-white/80">
            Cookies are used for authentication and security (such as session and CSRF tokens).
            Local storage is used for interface preferences.
          </p>
        </div>
      </section>

      {/* Section 2 */}
      <section className="space-y-4">
        <h2 className="font-display text-[22px] leading-7 font-medium tracking-[-0.02em] text-white">2. How We Use Your Information</h2>
        <ul className="flex list-disc flex-col gap-2 ps-5 text-[15px] leading-[25px] text-white/80 marker:text-white/40">
          <li>To provide and operate the Service</li>
          <li>To run your agents, workflows, and integrations</li>
          <li>To secure the Service and prevent abuse</li>
          <li>To fix bugs and improve the product</li>
        </ul>
        <p className="mt-3 text-[15px] leading-[25px] text-white/80">
          Your personal data and User Content are not sold.
        </p>
      </section>

      {/* Section 3 */}
      <section className="space-y-4">
        <h2 className="font-display text-[22px] leading-7 font-medium tracking-[-0.02em] text-white">3. AI Providers</h2>
        <p className="text-[15px] leading-[25px] text-white/80">
          To generate responses, the relevant parts of your conversations, agent instructions, and
          files are sent to the AI model provider configured for the Service. Only the data needed
          to fulfill a request is sent, and each provider's own privacy policy applies. Your
          content is not used by the Service to train AI models.
        </p>
      </section>

      {/* Section 4 */}
      <section className="space-y-4">
        <h2 className="font-display text-[22px] leading-7 font-medium tracking-[-0.02em] text-white">4. Sharing</h2>
        <p className="text-[15px] leading-[25px] text-white/80">Data may be shared with:</p>
        <ul className="flex list-disc flex-col gap-2 ps-5 text-[15px] leading-[25px] text-white/80 marker:text-white/40">
          <li>Infrastructure providers that host the Service (servers, database, email delivery)</li>
          <li>Third-party services you choose to connect</li>
          <li>Authorities, when required by law</li>
        </ul>
      </section>

      {/* Section 5 */}
      <section className="space-y-4">
        <h2 className="font-display text-[22px] leading-7 font-medium tracking-[-0.02em] text-white">5. Security</h2>
        <p className="text-[15px] leading-[25px] text-white/80">
          The Service uses HTTPS, HttpOnly authentication cookies, CSRF protection, and access
          controls. No online service is perfectly secure, but reasonable steps are taken to
          protect your data.
        </p>
      </section>

      {/* Section 6 */}
      <section className="space-y-4">
        <h2 className="font-display text-[22px] leading-7 font-medium tracking-[-0.02em] text-white">6. Retention & Deletion</h2>
        <p className="text-[15px] leading-[25px] text-white/80">
          Data is kept while your account is active or as needed to provide the Service. You can
          delete your content at any time and request deletion of your account. Some logs and
          backups may remain for a limited period for security purposes.
        </p>
      </section>

      {/* Section 7 */}
      <section className="space-y-4">
        <h2 className="font-display text-[22px] leading-7 font-medium tracking-[-0.02em] text-white">7. Your Rights</h2>
        <p className="text-[15px] leading-[25px] text-white/80">
          Depending on where you live, you may have the right to access, export, correct, or delete
          your data, restrict processing, or withdraw consent.
        </p>
      </section>

      {/* Section 8 */}
      <section className="space-y-4">
        <h2 className="font-display text-[22px] leading-7 font-medium tracking-[-0.02em] text-white">8. Children</h2>
        <p className="text-[15px] leading-[25px] text-white/80">
          The Service is not intended for anyone under 18, and data from minors is not knowingly
          collected.
        </p>
      </section>

      {/* Section 9 */}
      <section className="space-y-4">
        <h2 className="font-display text-[22px] leading-7 font-medium tracking-[-0.02em] text-white">9. Changes to This Policy</h2>
        <p className="text-[15px] leading-[25px] text-white/80">
          This policy may be updated from time to time. Continued use of the Service after an
          update means you accept the revised policy.
        </p>
      </section>

      {/* Section 10 */}
      <section className="space-y-4">
        <h2 className="font-display text-[22px] leading-7 font-medium tracking-[-0.02em] text-white">10. Contact</h2>
        <p className="text-[15px] leading-[25px] text-white/80">
          To exercise your rights or ask questions about this policy, contact the operator of this
          Agent Studio deployment.
        </p>
      </section>
    </LegalPage>
  );
}

export default PrivacyPolicy;
