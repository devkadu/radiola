import policy from "../../../config/bots.json";
import "server-only";

export const blockedBotAgents = policy.blockedAgents;

export const isBlockedBot = (userAgent: string): boolean => {
  const value = userAgent.toLowerCase();
  return blockedBotAgents.some((agent) => value.includes(agent.toLowerCase()));
};
