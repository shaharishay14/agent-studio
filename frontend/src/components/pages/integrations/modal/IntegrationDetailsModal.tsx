import { Zap } from 'lucide-react';

import useModalsStore from '../../../../../store/modals.store';
import { BrandIcon } from '@/components/ui/brand-icon';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Spinner } from '@/components/ui/spinner';
import { useGetToolCapabilities } from '../hooks';

// GMAIL_SEND_EMAIL -> "Send email" (the app name is already in the title)
const actionLabel = (slug: string, app: string) => {
  const words = slug.toLowerCase().split('_');
  const appWords = app.toLowerCase().replace(/[^a-z0-9]+/g, '_').split('_');
  const rest = words.slice(0, appWords.length).join('') === appWords.join('') ? words.slice(appWords.length) : words.slice(1);
  const text = (rest.length ? rest : words).join(' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

function IntegrationDetailsModal() {
  const { integrationDetailsModal, closeIntegrationDetailsModal } = useModalsStore();

  // שליפת ה-capabilities של הכלי
  const { capabilities, isLoading, isError } = useGetToolCapabilities(
    integrationDetailsModal.integrationSlug // שולח את שם הכלי כ-query parameter
  );

  const name = integrationDetailsModal.integrationName || 'Integration';
  const count = capabilities?.slugs?.length ?? capabilities?.count ?? 0;

  return (
    <Modal
      open={integrationDetailsModal.isOpen}
      onOpenChange={(open) => !open && closeIntegrationDetailsModal()}
      size="lg"
      icon={
        <span className="grid size-12 shrink-0 place-items-center rounded-pill border border-white/35 bg-white/10 text-white" aria-hidden="true">
          <BrandIcon name={integrationDetailsModal.integrationSlug || name} size={22} />
        </span>
      }
      title={
        <>
          What {name} <em className="sky-serif">can do</em>
        </>
      }
      description={isLoading ? 'Loading actions…' : `${count} ${count === 1 ? 'action' : 'actions'} your agents can use`}
      footer={
        <Button variant="glass" size="sm" onClick={closeIntegrationDetailsModal}>
          Close
        </Button>
      }
    >
      {isLoading && (
        <div className="grid min-h-[200px] place-items-center">
          <Spinner label="Loading actions" />
        </div>
      )}

      {isError && (
        <p className="m-0 rounded-2xl border border-off/40 bg-off/10 px-4 py-3 text-sm" role="alert">
          We couldn't load what {name} can do. Close this and try again.
        </p>
      )}

      {!isLoading && !isError && capabilities && (
        capabilities.slugs && capabilities.slugs.length > 0 ? (
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
            {capabilities.slugs.map((slug) => (
              <li key={slug} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5" title={slug}>
                <Zap className="size-3.5 shrink-0 text-white/60" strokeWidth={1.7} aria-hidden="true" />
                <span className="truncate text-sm">{actionLabel(slug, name)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Zap className="size-6 text-white/40" strokeWidth={1.7} aria-hidden="true" />
            <p className="m-0 text-white/72">No actions listed for {name} yet.</p>
          </div>
        )
      )}
    </Modal>
  );
}

export default IntegrationDetailsModal;
