const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

// GMAIL_SEND_EMAIL -> { app: "Gmail", action: "Send email" }
export const splitToolName = (tool: string) => {
  const [app, ...rest] = tool.split('_');
  return { app: capitalize(app), action: rest.length ? capitalize(rest.join(' ')) : '' };
};

// GMAIL_SEND_EMAIL -> "Gmail: send email"
export const formatToolName = (tool: string) => {
  const { app, action } = splitToolName(tool);
  return action ? `${app}: ${action.toLowerCase()}` : app;
};
