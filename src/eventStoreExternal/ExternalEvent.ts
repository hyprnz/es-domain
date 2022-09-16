import { Message } from "../eventSourcing/MessageTypes";

export interface ExternalEvent extends Message {
    eventId: string;
    readonly eventType: string;
  }