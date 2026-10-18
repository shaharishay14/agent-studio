import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      {/* Radial gradient light effect in center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(147, 51, 234, 0.15) 0%, transparent 50%)'
        }}
      />

      {/* Back Button */}
      <div className="flex mx-auto max-w-4xl px-4 pt-6 md:pt-8 relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
          <span className="text-sm md:text-base">Back</span>
        </button>
      </div>

      {/* Content Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pb-12 md:pb-20 relative z-10">
        {/* Header */}
        <div className="mb-8 md:mb-12 mt-4">
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-4xl font-bold mb-4">
            Agent Studio — Privacy Policy
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Template policy for self-hosted deployments of Agent Studio
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-gray-900/70 backdrop-blur-sm rounded-2xl p-6 sm:p-8 md:p-10 space-y-6 md:space-y-8 shadow-2xl border border-gray-800/50">
          {/* Introduction */}
          <div className="space-y-4 text-sm sm:text-base leading-relaxed">
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
            <h2 className="text-xl sm:text-2xl font-bold">1. Information We Collect</h2>

            {/* 1.1 */}
            <div className="space-y-3 mt-4">
              <h3 className="text-lg sm:text-xl font-semibold">1.1 Account Information</h3>
              <ul className="list-disc list-inside space-y-2 text-sm sm:text-base leading-relaxed pl-4">
                <li>Name and email address</li>
                <li>Authentication details (password hash or OAuth sign-in)</li>
                <li>Profile settings and preferences</li>
              </ul>
            </div>

            {/* 1.2 */}
            <div className="space-y-3 mt-4">
              <h3 className="text-lg sm:text-xl font-semibold">1.2 User Content</h3>
              <ul className="list-disc list-inside space-y-2 text-sm sm:text-base leading-relaxed pl-4">
                <li>Prompts, agents, workflows, and triggers you create</li>
                <li>Files you upload</li>
                <li>Conversation history with your agents</li>
                <li>Execution logs and outputs</li>
              </ul>
            </div>

            {/* 1.3 */}
            <div className="space-y-3 mt-4">
              <h3 className="text-lg sm:text-xl font-semibold">1.3 Usage Data</h3>
              <p className="text-sm sm:text-base leading-relaxed">
                Basic technical data such as feature usage, timestamps, error logs, IP address, and
                browser or device information, used for reliability and debugging.
              </p>
            </div>

            {/* 1.4 */}
            <div className="space-y-3 mt-4">
              <h3 className="text-lg sm:text-xl font-semibold">1.4 Integration Data</h3>
              <p className="text-sm sm:text-base leading-relaxed">
                When you connect a third-party service (for example email, calendar, messaging, or code
                hosting), data from that service is processed only as needed for the agents and
                workflows you configure. Connection authorization is handled through an integration
                provider rather than stored as plain-text credentials.
              </p>
            </div>

            {/* 1.5 */}
            <div className="space-y-3 mt-4">
              <h3 className="text-lg sm:text-xl font-semibold">1.5 Approvals & Automation Settings</h3>
              <p className="text-sm sm:text-base leading-relaxed">
                Approvals you grant to agents, automation settings, and related preferences are stored
                so the Service can run automated actions as you configured them.
              </p>
            </div>

            {/* 1.6 */}
            <div className="space-y-3 mt-4">
              <h3 className="text-lg sm:text-xl font-semibold">1.6 Cookies & Local Storage</h3>
              <p className="text-sm sm:text-base leading-relaxed">
                Cookies are used for authentication and security (such as session and CSRF tokens).
                Local storage is used for interface preferences.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 text-sm sm:text-base leading-relaxed pl-4">
              <li>To provide and operate the Service</li>
              <li>To run your agents, workflows, and integrations</li>
              <li>To secure the Service and prevent abuse</li>
              <li>To fix bugs and improve the product</li>
            </ul>
            <p className="text-sm sm:text-base leading-relaxed mt-3">
              Your personal data and User Content are not sold.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">3. AI Providers</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              To generate responses, the relevant parts of your conversations, agent instructions, and
              files are sent to the AI model provider configured for the Service. Only the data needed
              to fulfill a request is sent, and each provider's own privacy policy applies. Your
              content is not used by the Service to train AI models.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">4. Sharing</h2>
            <p className="text-sm sm:text-base leading-relaxed">Data may be shared with:</p>
            <ul className="list-disc list-inside space-y-2 text-sm sm:text-base leading-relaxed pl-4">
              <li>Infrastructure providers that host the Service (servers, database, email delivery)</li>
              <li>Third-party services you choose to connect</li>
              <li>Authorities, when required by law</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">5. Security</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              The Service uses HTTPS, HttpOnly authentication cookies, CSRF protection, and access
              controls. No online service is perfectly secure, but reasonable steps are taken to
              protect your data.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">6. Retention & Deletion</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              Data is kept while your account is active or as needed to provide the Service. You can
              delete your content at any time and request deletion of your account. Some logs and
              backups may remain for a limited period for security purposes.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">7. Your Rights</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              Depending on where you live, you may have the right to access, export, correct, or delete
              your data, restrict processing, or withdraw consent.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">8. Children</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              The Service is not intended for anyone under 18, and data from minors is not knowingly
              collected.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">9. Changes to This Policy</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              This policy may be updated from time to time. Continued use of the Service after an
              update means you accept the revised policy.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">10. Contact</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              To exercise your rights or ask questions about this policy, contact the operator of this
              Agent Studio deployment.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
