"""Async message queue for decoupled channel-agent communication."""

import asyncio
from typing import Callable

from nanobot.bus.events import InboundMessage, OutboundMessage


class MessageBus:
    """
    Async message bus that decouples chat channels from the agent core.

    Channels push messages to the inbound queue, and the agent processes
    them and pushes responses to the outbound queue.
    
    Supports multiple subscribers for outbound messages (pub-sub pattern).
    """

    def __init__(self):
        self.inbound: asyncio.Queue[InboundMessage] = asyncio.Queue()
        self.outbound: asyncio.Queue[OutboundMessage] = asyncio.Queue()
        self._outbound_subscribers: list[Callable[[OutboundMessage], None]] = []
        self._outbound_queues: list[asyncio.Queue[OutboundMessage]] = []

    async def publish_inbound(self, msg: InboundMessage) -> None:
        """Publish a message from a channel to the agent."""
        await self.inbound.put(msg)

    async def consume_inbound(self) -> InboundMessage:
        """Consume the next inbound message (blocks until available)."""
        return await self.inbound.get()

    async def publish_outbound(self, msg: OutboundMessage) -> None:
        """Publish a response from the agent to channels and all subscribers."""
        await self.outbound.put(msg)
        for q in self._outbound_queues:
            try:
                q.put_nowait(msg)
            except asyncio.QueueFull:
                pass

    async def consume_outbound(self) -> OutboundMessage:
        """Consume the next outbound message (blocks until available)."""
        return await self.outbound.get()

    def subscribe_outbound(self) -> asyncio.Queue[OutboundMessage]:
        """Subscribe to outbound messages. Returns a queue that will receive all outbound messages."""
        q: asyncio.Queue[OutboundMessage] = asyncio.Queue(maxsize=100)
        self._outbound_queues.append(q)
        return q

    def unsubscribe_outbound(self, q: asyncio.Queue[OutboundMessage]) -> None:
        """Unsubscribe from outbound messages."""
        if q in self._outbound_queues:
            self._outbound_queues.remove(q)

    @property
    def inbound_size(self) -> int:
        """Number of pending inbound messages."""
        return self.inbound.qsize()

    @property
    def outbound_size(self) -> int:
        """Number of pending outbound messages."""
        return self.outbound.qsize()
