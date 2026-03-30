"""Channel manager for coordinating chat channels."""

from __future__ import annotations

import asyncio
from typing import Any

from loguru import logger

from nanobot.bus.queue import MessageBus
from nanobot.channels.base import BaseChannel
from nanobot.config.schema import Config


class ChannelManager:
    """
    Manages chat channels and coordinates message routing.

    Responsibilities:
    - Initialize enabled channels (Telegram, WhatsApp, etc.)
    - Start/stop channels
    - Route outbound messages
    """

    def __init__(self, config: Config, bus: MessageBus):
        self.config = config
        self.bus = bus
        self.channels: dict[str, BaseChannel] = {}
        self._dispatch_task: asyncio.Task | None = None
        self._outbound_queue: asyncio.Queue | None = None

        self._init_channels()

    def _init_channels(self) -> None:
        """Initialize channels discovered via pkgutil scan + entry_points plugins."""
        from nanobot.channels.registry import discover_all

        groq_key = self.config.providers.groq.api_key

        for name, cls in discover_all().items():
            section = getattr(self.config.channels, name, None)
            if section is None:
                continue
            enabled = (
                section.get("enabled", False)
                if isinstance(section, dict)
                else getattr(section, "enabled", False)
            )
            if not enabled:
                continue
            try:
                channel = cls(section, self.bus)
                channel.transcription_api_key = groq_key
                self.channels[name] = channel
                logger.info("{} channel enabled", cls.display_name)
            except Exception as e:
                logger.warning("{} channel not available: {}", name, e)

        self._validate_allow_from()

    def _validate_allow_from(self) -> None:
        for name, ch in self.channels.items():
            if getattr(ch.config, "allow_from", None) == []:
                logger.warning(
                    '{} has empty allowFrom, defaulting to ["*"] (allow everyone)',
                    name
                )
                ch.config.allow_from = ["*"]

    async def _start_channel(self, name: str, channel: BaseChannel) -> None:
        """Start a channel and log any exceptions."""
        try:
            await channel.start()
        except Exception as e:
            logger.error("Failed to start channel {}: {}", name, e)

    async def start_all(self) -> None:
        """Start all channels and the outbound dispatcher."""
        if not self.channels:
            logger.warning("No channels enabled")
            return

        # Start outbound dispatcher
        self._dispatch_task = asyncio.create_task(self._dispatch_outbound())

        # Start channels
        tasks = []
        for name, channel in self.channels.items():
            logger.info("Starting {} channel...", name)
            tasks.append(asyncio.create_task(self._start_channel(name, channel)))

        # Wait for all to complete (they should run forever)
        await asyncio.gather(*tasks, return_exceptions=True)

    async def stop_all(self) -> None:
        """Stop all channels and the dispatcher."""
        logger.info("Stopping all channels...")

        # Stop dispatcher
        if self._dispatch_task:
            self._dispatch_task.cancel()
            try:
                await self._dispatch_task
            except asyncio.CancelledError:
                pass

        # Unsubscribe from outbound queue
        if self._outbound_queue:
            self.bus.unsubscribe_outbound(self._outbound_queue)

        # Stop all channels
        for name, channel in self.channels.items():
            try:
                await channel.stop()
                logger.info("Stopped {} channel", name)
            except Exception as e:
                logger.error("Error stopping {}: {}", name, e)

    async def _dispatch_outbound(self) -> None:
        """Dispatch outbound messages to the appropriate channel."""
        logger.info("Outbound dispatcher started")
        self._outbound_queue = self.bus.subscribe_outbound()

        while True:
            try:
                msg = await asyncio.wait_for(
                    self._outbound_queue.get(),
                    timeout=1.0
                )

                if msg.metadata.get("_progress"):
                    if msg.metadata.get("_tool_hint") and not self.config.channels.send_tool_hints:
                        continue
                    if not msg.metadata.get("_tool_hint") and not self.config.channels.send_progress:
                        continue

                channel = self.channels.get(msg.channel)
                if channel:
                    try:
                        await channel.send(msg)
                    except Exception as e:
                        logger.error("Error sending to {}: {}", msg.channel, e)
                else:
                    logger.warning("Unknown channel: {}", msg.channel)

            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                break

    def get_channel(self, name: str) -> BaseChannel | None:
        """Get a channel by name."""
        return self.channels.get(name)

    def get_status(self) -> dict[str, Any]:
        """Get status of all channels."""
        return {
            name: {
                "enabled": True,
                "running": channel.is_running
            }
            for name, channel in self.channels.items()
        }

    @property
    def enabled_channels(self) -> list[str]:
        """Get list of enabled channel names."""
        return list(self.channels.keys())

    async def start_channel(self, name: str) -> bool:
        """Start a specific channel dynamically."""
        if name in self.channels:
            channel = self.channels[name]
            if not channel.is_running:
                try:
                    await channel.start()
                    logger.info("Started {} channel", name)
                    return True
                except Exception as e:
                    logger.error("Failed to start {}: {}", name, e)
                    return False
            return True
        return False

    async def stop_channel(self, name: str) -> bool:
        """Stop a specific channel dynamically."""
        if name in self.channels:
            channel = self.channels[name]
            if channel.is_running:
                try:
                    await channel.stop()
                    logger.info("Stopped {} channel", name)
                    return True
                except Exception as e:
                    logger.error("Failed to stop {}: {}", name, e)
                    return False
            return True
        return False

    async def reload_channel(self, name: str) -> bool:
        """Reload a channel with new config."""
        if name in self.channels:
            await self.stop_channel(name)
        
        from nanobot.channels.registry import discover_all
        
        section = getattr(self.config.channels, name, None)
        if section is None:
            return False
            
        enabled = (
            section.get("enabled", False)
            if isinstance(section, dict)
            else getattr(section, "enabled", False)
        )
        
        if not enabled:
            if name in self.channels:
                del self.channels[name]
            return True
            
        for ch_name, cls in discover_all().items():
            if ch_name == name:
                try:
                    channel = cls(section, self.bus)
                    channel.transcription_api_key = self.config.providers.groq.api_key
                    if getattr(channel.config, "allow_from", None) == []:
                        channel.config.allow_from = ["*"]
                    self.channels[name] = channel
                    await channel.start()
                    logger.info("Reloaded and started {} channel", name)
                    return True
                except Exception as e:
                    logger.error("Failed to reload {}: {}", name, e)
                    return False
        return False
