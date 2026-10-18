import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

function TermsOfService() {
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

      {/* Back Button - Centered */}
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
            Agent Studio — Terms of Service
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Template terms for self-hosted deployments of Agent Studio
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-gray-900/70 backdrop-blur-sm rounded-2xl p-6 sm:p-8 md:p-10 space-y-6 md:space-y-8 shadow-2xl border border-gray-800/50">
          {/* Introduction */}
          <div className="space-y-4 text-sm sm:text-base leading-relaxed">
            <p>
              Welcome to Agent Studio. These Terms of Service ("Terms") govern your access to and use
              of this Agent Studio deployment, including its web application, APIs, and integrations
              (collectively, the "Service"). "We", "us", and "our" refer to the operator of this
              deployment.
            </p>
            <p>
              Agent Studio is an open-source project. If you run your own instance, you are the
              operator and should adapt these Terms to your own needs before offering the Service to
              others.
            </p>
            <p>
              By creating an account, accessing, or using the Service, you agree to these Terms. If you
              do not agree, do not use the Service.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">1. The Service</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              Agent Studio lets users create, configure, run, and share AI agents, workflows, and
              automations, and connect them to third-party services.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">2. Accounts</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              Some features require an account. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm sm:text-base leading-relaxed pl-4">
              <li>Provide accurate information</li>
              <li>Keep your credentials secure</li>
              <li>Take responsibility for activity on your account</li>
            </ul>
            <p className="text-sm sm:text-base leading-relaxed">
              Accounts that violate these Terms or pose a security risk may be suspended or removed.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">3. Credits & Usage Limits</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              The Service may track usage with credits that are consumed per interaction or automated
              execution, and may limit API calls, automation frequency, concurrent requests, or
              storage to keep the platform stable. Excessive or abusive usage may be throttled or
              suspended.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">4. Acceptable Use</h2>
            <p className="text-sm sm:text-base leading-relaxed">You agree not to use the Service to:</p>
            <ul className="list-disc list-inside space-y-2 text-sm sm:text-base leading-relaxed pl-4">
              <li>Violate any law or regulation</li>
              <li>Generate or share illegal, harmful, or abusive content</li>
              <li>Automate harmful or unauthorized actions (e.g., spam, harassment, scraping)</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Probe or circumvent security measures or rate limits</li>
              <li>Misrepresent your identity or affiliation</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">5. Your Content</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              You keep all rights to the prompts, agents, workflows, files, and other materials you
              create or upload ("User Content"). You grant the operator a limited license to host,
              store, process, and display your User Content as needed to run the Service, including
              executing your agents and integrations.
            </p>
            <p className="text-sm sm:text-base leading-relaxed">
              If you share an agent publicly, others will be able to view and interact with it. Private
              agents are never made public without your action.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">6. Automated Actions</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              Agents can take actions on your behalf, and an approval you give for a specific action
              may be reused for identical or substantially similar requests. You are responsible for
              the approvals and permissions you grant and for monitoring agents that act
              automatically. You can revoke approvals and disconnect integrations at any time where
              the Service supports it.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">7. AI Outputs</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              AI-generated content may be inaccurate, incomplete, or unexpected. Review outputs before
              relying on them. You are responsible for decisions and actions taken based on AI
              output.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">8. Third-Party Services</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              The Service integrates with third-party providers such as AI model providers, email,
              messaging, and productivity tools. Your use of those services is governed by their own
              terms and policies, and the operator is not responsible for their availability, data
              practices, or for actions your agents perform through them.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">9. Privacy</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              Personal data is processed only as needed to operate the Service, as described in the
              Privacy Policy.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">10. Availability & Changes</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              The Service may change, be interrupted, or be discontinued at any time. Features may be
              experimental. There is no guarantee of uninterrupted or error-free operation, or of
              protection against data loss.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">11. Termination</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              You may stop using the Service at any time. Access may be suspended or ended if you
              violate these Terms or your use creates security or operational risks.
            </p>
          </section>

          {/* Section 12 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">12. Disclaimer & Limitation of Liability</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              The Service is provided "as is" and "as available", without warranties of any kind,
              including merchantability, fitness for a particular purpose, and non-infringement. To
              the maximum extent permitted by law, the operator is not liable for indirect,
              incidental, special, consequential, or punitive damages arising from your use of the
              Service, AI outputs, automated actions, or third-party integrations.
            </p>
          </section>

          {/* Section 13 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">13. Changes to These Terms</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              These Terms may be updated from time to time. Continued use of the Service after an
              update means you accept the revised Terms.
            </p>
          </section>

          {/* Section 14 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">14. Contact</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              For questions about these Terms, contact the operator of this Agent Studio deployment.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default TermsOfService;
