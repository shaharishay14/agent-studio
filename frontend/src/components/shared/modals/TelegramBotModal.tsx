import { useEffect, useId, useState } from 'react';
import { ExternalLink, Link2, Lock, Unplug } from 'lucide-react';

import { BrandIcon } from '@/components/ui/brand-icon';
import { Button } from '@/components/ui/button';
import { IconCircle } from '@/components/ui/icon-circle';
import { Modal } from '@/components/ui/modal';
import { PillInput } from '@/components/ui/pill-input';
import { StatusDot } from '@/components/ui/status-dot';
import useModalsStore from '../../../../store/modals.store';
import { useConnectTelegramBot, useGetTelegramBot, useDisconnectTelegramBot } from '../../pages/chat/hooks';
import type { TelegramBotResponse } from '../../pages/chat/types';

function TelegramBotModal() {
  const { telegramBotModal, closeTelegramBotModal } = useModalsStore();
  const [botToken, setBotToken] = useState('');
  const [connectedBot, setConnectedBot] = useState<TelegramBotResponse | null>(null);
  const formId = useId();
  
  const agentId = telegramBotModal.agentId || '';
  const connectBot = useConnectTelegramBot(agentId);
  const disconnectBot = useDisconnectTelegramBot(agentId);
  const { data: existingBot } = useGetTelegramBot(agentId);

  // Show the existing bot when the modal opens
  useEffect(() => {
    if (telegramBotModal.isOpen && existingBot) {
      setConnectedBot(existingBot);
    }
  }, [telegramBotModal.isOpen, existingBot]);

  // Reset when the modal closes
  useEffect(() => {
    if (!telegramBotModal.isOpen) {
      setBotToken('');
      setConnectedBot(null);
    }
  }, [telegramBotModal.isOpen]);

  const handleConnect = async () => {
    if (!botToken.trim()) return;
    
    try {
      const result = await connectBot.mutateAsync({ bot_token: botToken.trim() });
      setConnectedBot(result);
      setBotToken('');
    } catch (error) {
      // The hook already shows the error
      console.error('Error connecting bot:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectBot.mutateAsync();
      setConnectedBot(null);
    } catch (error) {
      // The hook already shows the error
      console.error('Error disconnecting bot:', error);
    }
  };

  const handleClose = () => {
    setBotToken('');
    setConnectedBot(null);
    closeTelegramBotModal();
  };

  const handleOpenChat = () => {
    if (connectedBot?.bot_username) {
      window.open(`https://t.me/${connectedBot.bot_username}`, '_blank');
    }
  };

  return (
    <Modal
      open={telegramBotModal.isOpen}
      onOpenChange={(open) => !open && handleClose()}
      title="Telegram bot"
      description="Chat with your agent from Telegram. Messages there don't use credits."
      icon={
        <IconCircle>
          <BrandIcon name="telegram" size={16} />
        </IconCircle>
      }
      footer={
        connectedBot ? undefined : (
          <>
            <Button variant="glass" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" form={formId} size="sm" disabled={!botToken.trim()} loading={connectBot.isPending}>
              {connectBot.isPending ? 'Connecting…' : 'Connect bot'}
            </Button>
          </>
        )
      }
    >
      {connectedBot ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-inner border border-white/15 bg-white/[0.04] p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-pill bg-white text-on-white" aria-hidden="true">
              <BrandIcon name="telegram" size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[15px] font-semibold break-words">@{connectedBot.bot_username}</p>
              <p className="m-0 flex items-center gap-2 text-[13px] text-white/72">
                <StatusDot status="live" />
                Connected, ready for messages
              </p>
            </div>
          </div>

          {/* Only the linked owner account gets the agent's connected apps and history */}
          <div className="flex items-start gap-2.5 rounded-2xl border border-white/12 bg-night/50 px-4 py-3 text-sm leading-[21px] text-white/80">
            {connectedBot.owner_linked ? (
              <>
                <Lock className="mt-0.5 size-4 shrink-0" strokeWidth={1.7} aria-hidden="true" />
                <span>Your Telegram account is linked. Other people can chat with the bot, but can't use your connected apps or see your history.</span>
              </>
            ) : connectedBot.owner_link_code ? (
              <>
                <Link2 className="mt-0.5 size-4 shrink-0" strokeWidth={1.7} aria-hidden="true" />
                <span>
                  To use your connected apps from Telegram, send this to the bot from your own account:{' '}
                  <code className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[13px] font-semibold text-white">/link {connectedBot.owner_link_code}</code>
                </span>
              </>
            ) : (
              <>
                <Link2 className="mt-0.5 size-4 shrink-0" strokeWidth={1.7} aria-hidden="true" />
                <span>Reconnect the bot to link your Telegram account and use your connected apps from Telegram.</span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={handleOpenChat} className="flex-1">
              <ExternalLink />
              Open in Telegram
            </Button>
            <Button variant="glass" size="sm" onClick={handleDisconnect} loading={disconnectBot.isPending} className="hover:text-off">
              <Unplug />
              {disconnectBot.isPending ? 'Disconnecting…' : 'Disconnect'}
            </Button>
          </div>
        </div>
      ) : (
        <form
          id={formId}
          onSubmit={(e) => {
            e.preventDefault();
            handleConnect();
          }}
          className="flex flex-col gap-4"
        >
          <PillInput
            label="Bot token"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="123456:ABC-DEF…"
            autoComplete="off"
            spellCheck={false}
            autoFocus
          />
          <div className="rounded-2xl border border-white/12 bg-night/50 px-4 py-3.5 text-sm leading-[21px] text-white/80">
            <p className="m-0 mb-2 font-medium text-white">Getting a token from BotFather</p>
            <ul className="m-0 flex list-disc flex-col gap-1.5 ps-5 marker:text-white/40">
              <li>
                Open{' '}
                <a href="https://t.me/botfather" target="_blank" rel="noopener noreferrer" className="font-medium text-white underline decoration-white/40 underline-offset-3 hover:decoration-white">
                  BotFather
                </a>{' '}
                in Telegram
              </li>
              <li>
                Send <code className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[13px] text-white">/newbot</code>
              </li>
              <li>Choose a name and a username ending in “bot”</li>
              <li>Copy the token it sends you and paste it above</li>
            </ul>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default TelegramBotModal;
