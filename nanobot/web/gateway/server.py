"""Web gateway server with WebSocket and REST API support."""

import asyncio
import json
import uuid
from pathlib import Path
from typing import Any, TYPE_CHECKING

from aiohttp import web
import aiohttp

from nanobot.agent.loop import AgentLoop
from nanobot.agent.skills import SkillsLoader
from nanobot.bus.events import InboundMessage, OutboundMessage
from nanobot.bus.queue import MessageBus
from nanobot.config.loader import save_config
from nanobot.config.schema import Config
from nanobot.config.paths import get_media_dir
from nanobot.session.manager import SessionManager

if TYPE_CHECKING:
    from nanobot.channels.manager import ChannelManager


class WebGateway:
    """Web gateway providing WebSocket chat and REST API."""

    def __init__(
        self,
        agent: AgentLoop,
        bus: MessageBus,
        config: Config,
        session_manager: SessionManager,
        static_dir: Path | None = None,
        channel_manager: "ChannelManager | None" = None,
    ):
        self.agent = agent
        self.bus = bus
        self.config = config
        self.session_manager = session_manager
        self.static_dir = static_dir or Path(__file__).parent.parent / "static"
        self.channel_manager = channel_manager
        self.app = web.Application()
        self.websocket_clients: dict[str, web.WebSocketResponse] = {}
        self._outbound_task: asyncio.Task | None = None
        self._outbound_queue: asyncio.Queue | None = None
        self._setup_routes()

    async def _start_outbound_listener(self) -> None:
        """Listen for outbound messages and broadcast to WebSocket clients."""
        self._outbound_queue = self.bus.subscribe_outbound()
        while True:
            try:
                msg = await self._outbound_queue.get()
                if msg.channel == "web":
                    continue
                await self._broadcast_outbound(msg)
            except asyncio.CancelledError:
                break
            except Exception as e:
                import traceback
                traceback.print_exc()

    async def _broadcast_outbound(self, msg: OutboundMessage) -> None:
        """Broadcast an outbound message to all WebSocket clients."""
        session_key = f"{msg.channel}:{msg.chat_id}"
        session = self.session_manager._cache.get(session_key)
        
        broadcast_data = {
            "type": "external_message",
            "channel": msg.channel,
            "chat_id": msg.chat_id,
            "session_key": session_key,
            "content": msg.content,
            "metadata": msg.metadata or {},
        }
        
        if session:
            latest_user_msg = None
            for m in reversed(session.messages):
                if m.get("role") == "user":
                    content = m.get("content", "")
                    if isinstance(content, str):
                        latest_user_msg = content
                    break
            if latest_user_msg:
                broadcast_data["preview"] = latest_user_msg[:100]
                broadcast_data["user_message"] = latest_user_msg
        
        disconnected = []
        for client_id, ws in self.websocket_clients.items():
            try:
                await ws.send_json(broadcast_data)
            except Exception:
                disconnected.append(client_id)
        
        for client_id in disconnected:
            self.websocket_clients.pop(client_id, None)

    def _setup_routes(self) -> None:
        """Setup all routes for the web gateway."""
        self.app.router.add_get("/api/status", self._handle_status)
        self.app.router.add_get("/api/channels", self._handle_channels)
        self.app.router.add_post("/api/channels/{name}/reload", self._handle_channel_reload)
        self.app.router.add_get("/api/providers", self._handle_providers)
        self.app.router.add_get("/api/skills", self._handle_skills_list)
        self.app.router.add_get("/api/skills/{name}", self._handle_skill_get)
        self.app.router.add_delete("/api/skills/{name}", self._handle_skill_delete)
        self.app.router.add_get("/api/skillhub/search", self._handle_skillhub_search)
        self.app.router.add_post("/api/skillhub/install", self._handle_skillhub_install)
        self.app.router.add_get("/api/cron", self._handle_cron)
        self.app.router.add_post("/api/cron", self._handle_cron_create)
        self.app.router.add_delete("/api/cron/{job_id}", self._handle_cron_delete)
        self.app.router.add_get("/api/config", self._handle_config_get)
        self.app.router.add_post("/api/config", self._handle_config_update)
        self.app.router.add_get("/api/sessions", self._handle_sessions_list)
        self.app.router.add_get("/api/sessions/{key:.*}", self._handle_session_get)
        self.app.router.add_delete("/api/sessions/{key:.*}", self._handle_session_delete)
        self.app.router.add_get("/ws/chat", self._handle_websocket)
        media_dir = get_media_dir()
        if media_dir.exists():
            self.app.router.add_static("/media", media_dir, name="media")
        if self.static_dir.exists():
            self.app.router.add_static("/assets", self.static_dir / "assets", name="static")
        self.app.router.add_get("/", self._handle_index)
        self.app.router.add_get("/{path:.*}", self._handle_spa)

    async def _handle_index(self, request: web.Request) -> web.Response:
        """Serve index.html for SPA routing."""
        index_path = self.static_dir / "index.html"
        if index_path.exists():
            return web.Response(
                body=index_path.read_text(),
                content_type="text/html",
            )
        return web.Response(text="Frontend not built. Run: cd web && npm run build", status=404)

    async def _handle_spa(self, request: web.Request) -> web.Response:
        """Serve index.html for SPA routing (catch-all)."""
        return await self._handle_index(request)

    async def _handle_status(self, request: web.Request) -> web.Response:
        """Get system status."""
        return web.json_response({
            "status": "running",
            "version": "0.1.0",
            "connected_clients": len(self.websocket_clients),
        })

    async def _handle_channels(self, request: web.Request) -> web.Response:
        """Get channel configurations."""
        channels = []
        channel_configs = self.config.channels.model_dump()
        for name, cfg in channel_configs.items():
            if isinstance(cfg, dict):
                channels.append({
                    "id": name,
                    "name": name.title(),
                    "enabled": cfg.get("enabled", False),
                    "status": "connected" if cfg.get("enabled") else "disconnected",
                })
        return web.json_response({"channels": channels})

    async def _handle_channel_reload(self, request: web.Request) -> web.Response:
        """Reload a channel with new config."""
        name = request.match_info["name"]
        if self.channel_manager:
            success = await self.channel_manager.reload_channel(name)
            if success:
                return web.json_response({"status": "reloaded"})
            return web.json_response({"error": "Failed to reload channel"}, status=400)
        return web.json_response({"error": "Channel manager not available"}, status=500)

    async def _handle_providers(self, request: web.Request) -> web.Response:
        """Get provider configurations."""
        providers = []
        provider_configs = self.config.providers.model_dump()
        for name, cfg in provider_configs.items():
            if isinstance(cfg, dict):
                providers.append({
                    "id": name,
                    "name": name.replace("_", " ").title(),
                    "configured": bool(cfg.get("api_key") or cfg.get("base_url")),
                    "model": cfg.get("model", "-"),
                })
        return web.json_response({"providers": providers})

    async def _handle_skills_list(self, request: web.Request) -> web.Response:
        """Get all available skills."""
        skills_loader = SkillsLoader(self.config.workspace_path)
        skills = []
        for s in skills_loader.list_skills(filter_unavailable=False):
            meta = skills_loader.get_skill_metadata(s["name"]) or {}
            skill_meta_raw = meta.get("metadata", "")
            import json
            try:
                skill_meta = json.loads(skill_meta_raw) if skill_meta_raw else {}
                skill_meta = skill_meta.get("nanobot", skill_meta.get("openclaw", {}))
            except:
                skill_meta = {}
            
            requires = skill_meta.get("requires", {})
            missing_bins = [b for b in requires.get("bins", []) if not __import__("shutil").which(b)]
            missing_env = [e for e in requires.get("env", []) if not __import__("os").environ.get(e)]
            available = len(missing_bins) == 0 and len(missing_env) == 0
            
            skills.append({
                "id": s["name"],
                "name": meta.get("name", s["name"]).strip('"\''),
                "description": meta.get("description", "").strip('"\''),
                "source": s["source"],
                "available": available,
                "emoji": skill_meta.get("emoji", ""),
                "requires": {
                    "bins": requires.get("bins", []),
                    "env": requires.get("env", []),
                },
                "missing": {
                    "bins": missing_bins,
                    "env": missing_env,
                },
            })
        return web.json_response({"skills": skills})

    async def _handle_skill_get(self, request: web.Request) -> web.Response:
        """Get a specific skill's content."""
        name = request.match_info["name"]
        skills_loader = SkillsLoader(self.config.workspace_path)
        content = skills_loader.load_skill(name)
        if content is None:
            return web.json_response({"error": "Skill not found"}, status=404)
        meta = skills_loader.get_skill_metadata(name) or {}
        skill_meta_raw = meta.get("metadata", "")
        import json
        try:
            skill_meta = json.loads(skill_meta_raw) if skill_meta_raw else {}
            skill_meta = skill_meta.get("nanobot", skill_meta.get("openclaw", {}))
        except:
            skill_meta = {}
        return web.json_response({
            "id": name,
            "name": meta.get("name", name).strip('"\''),
            "description": meta.get("description", "").strip('"\''),
            "content": content,
            "emoji": skill_meta.get("emoji", ""),
        })

    async def _handle_skill_delete(self, request: web.Request) -> web.Response:
        """Delete a workspace skill."""
        name = request.match_info["name"]
        skills_loader = SkillsLoader(self.config.workspace_path)
        
        workspace_skill = skills_loader.workspace_skills / name
        if not workspace_skill.exists():
            return web.json_response({"error": "Skill not found"}, status=404)
        
        builtin_skill = skills_loader.builtin_skills / name if skills_loader.builtin_skills else None
        if builtin_skill and builtin_skill.exists():
            return web.json_response({"error": "Cannot delete built-in skills"}, status=403)
        
        import shutil
        try:
            shutil.rmtree(workspace_skill)
            return web.json_response({"status": "deleted", "name": name})
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)

    async def _handle_skillhub_search(self, request: web.Request) -> web.Response:
        """Search skills from SkillHub."""
        query = request.query.get("q", "")
        if not query:
            return web.json_response({"error": "Missing query parameter 'q'"}, status=400)
        
        search_url = f"https://lightmake.site/api/v1/search?q={query}"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    search_url,
                    timeout=aiohttp.ClientTimeout(total=10),
                    headers={"Accept": "application/json"}
                ) as resp:
                    if resp.status != 200:
                        return web.json_response({"error": f"SkillHub search failed: {resp.status}"}, status=502)
                    data = await resp.json()
                    items = data.get("results", data) if isinstance(data, dict) else data
                    results = []
                    for item in items if isinstance(items, list) else []:
                        results.append({
                            "slug": item.get("slug", ""),
                            "name": item.get("name", item.get("slug", "")),
                            "description": item.get("description", ""),
                            "version": item.get("version", ""),
                        })
                    return web.json_response({"results": results, "query": query})
        except asyncio.TimeoutError:
            return web.json_response({"error": "SkillHub search timeout"}, status=504)
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)

    async def _handle_skillhub_install(self, request: web.Request) -> web.Response:
        """Install a skill from SkillHub."""
        try:
            data = await request.json()
            slug = data.get("slug", "")
            if not slug:
                return web.json_response({"error": "Missing 'slug' parameter"}, status=400)
            
            workspace_skills = self.config.workspace_path / "skills"
            workspace_skills.mkdir(parents=True, exist_ok=True)
            target_dir = workspace_skills / slug
            
            download_url = f"https://lightmake.site/api/v1/download?slug={slug}"
            
            import tempfile
            import zipfile
            
            async with aiohttp.ClientSession() as session:
                async with session.get(download_url, timeout=aiohttp.ClientTimeout(total=60)) as resp:
                    if resp.status != 200:
                        return web.json_response({"error": f"Download failed: {resp.status}"}, status=502)
                    
                    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp:
                        tmp.write(await resp.read())
                        tmp_path = tmp.name
            
            try:
                target_dir.mkdir(parents=True, exist_ok=True)
                with zipfile.ZipFile(tmp_path, 'r') as zf:
                    for member in zf.namelist():
                        if member.endswith('/'):
                            continue
                        parts = member.split('/')
                        if len(parts) > 1 and parts[0] == slug:
                            relative = '/'.join(parts[1:])
                        else:
                            relative = member
                        target_path = target_dir / relative
                        target_path.parent.mkdir(parents=True, exist_ok=True)
                        with zf.open(member) as src, open(target_path, 'wb') as dst:
                            dst.write(src.read())
            finally:
                Path(tmp_path).unlink(missing_ok=True)
            
            return web.json_response({
                "status": "installed",
                "slug": slug,
                "path": str(target_dir),
            })
        except asyncio.TimeoutError:
            return web.json_response({"error": "Download timeout"}, status=504)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return web.json_response({"error": str(e)}, status=500)

    async def _handle_cron(self, request: web.Request) -> web.Response:
        """Get scheduled tasks."""
        jobs = []
        if hasattr(self.agent, "cron_service") and self.agent.cron_service:
            for job in self.agent.cron_service.list_jobs():
                jobs.append({
                    "id": job.id,
                    "name": job.name,
                    "schedule": job.schedule,
                    "enabled": job.enabled,
                    "next_run": str(job.next_run) if job.next_run else None,
                })
        return web.json_response({"jobs": jobs})

    async def _handle_cron_create(self, request: web.Request) -> web.Response:
        """Create a new scheduled task."""
        try:
            data = await request.json()
            return web.json_response({"status": "created"}, status=201)
        except Exception as e:
            return web.json_response({"error": str(e)}, status=400)

    async def _handle_cron_delete(self, request: web.Request) -> web.Response:
        """Delete a scheduled task."""
        job_id = request.match_info["job_id"]
        return web.json_response({"status": "deleted"})

    async def _handle_config_get(self, request: web.Request) -> web.Response:
        """Get current configuration."""
        return web.json_response(self.config.model_dump())

    async def _handle_config_update(self, request: web.Request) -> web.Response:
        """Update configuration."""
        try:
            data = await request.json()
            from nanobot.config.paths import get_config_path
            config_path = get_config_path()
            new_config = Config(**data)
            save_config(new_config, config_path)
            self.config = new_config
            if self.channel_manager:
                self.channel_manager.config = new_config
            self._update_agent_provider()
            return web.json_response({"status": "updated"})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return web.json_response({"error": str(e)}, status=400)

    def _update_agent_provider(self) -> None:
        """Update agent provider with new config."""
        from nanobot.providers.litellm_provider import LiteLLMProvider
        from nanobot.providers.registry import find_by_name
        from nanobot.providers.base import GenerationSettings

        model = self.config.agents.defaults.model
        provider_name = self.config.get_provider_name(model)
        p = self.config.get_provider(model)

        if provider_name == "custom":
            from nanobot.providers.custom_provider import CustomProvider
            provider = CustomProvider(
                api_key=p.api_key if p else "no-key",
                api_base=self.config.get_api_base(model) or "http://localhost:8000/v1",
                default_model=model,
                extra_headers=p.extra_headers if p else None,
            )
        else:
            spec = find_by_name(provider_name)
            provider = LiteLLMProvider(
                api_key=p.api_key if p else None,
                api_base=self.config.get_api_base(model),
                default_model=model,
                extra_headers=p.extra_headers if p else None,
                provider_name=provider_name,
            )

        defaults = self.config.agents.defaults
        provider.generation = GenerationSettings(
            temperature=defaults.temperature,
            max_tokens=defaults.max_tokens,
            reasoning_effort=defaults.reasoning_effort,
        )

        self.agent.provider = provider
        self.agent.model = model

    async def _handle_sessions_list(self, request: web.Request) -> web.Response:
        """List all sessions."""
        sessions = self.session_manager.list_sessions()
        result = []
        for s in sessions:
            key = s.get("key", "")
            parts = key.split(":")
            channel = parts[0] if len(parts) > 0 else "unknown"
            chat_id = parts[1][:8] if len(parts) > 1 else key[:8]
            
            title = f"{channel.title()}: {chat_id}"
            if channel.lower() == "web" or key.startswith("web-"):
                session = self.session_manager.get_or_create(key)
                messages = session.messages
                user_messages = [m for m in messages if m.get("role") == "user"]
                if user_messages:
                    last_user_msg = user_messages[-1]
                    content = last_user_msg.get("content", "")
                    if len(content) > 50:
                        title = content[:50] + "..."
                    else:
                        title = content if content else f"Web: {chat_id}"
            
            result.append({
                "id": key,
                "title": title,
                "channel": channel,
                "created_at": s.get("created_at"),
                "updated_at": s.get("updated_at"),
            })
        return web.json_response({"sessions": result})

    async def _handle_session_get(self, request: web.Request) -> web.Response:
        """Get a specific session with messages."""
        key = request.match_info["key"]
        session = self.session_manager.get_or_create(key)
        messages = []
        for msg in session.messages:
            messages.append({
                "id": str(uuid.uuid4()),
                "role": msg.get("role", "user"),
                "content": msg.get("content", ""),
                "timestamp": msg.get("timestamp", ""),
            })
        return web.json_response({
            "id": key,
            "messages": messages,
        })

    async def _handle_session_delete(self, request: web.Request) -> web.Response:
        """Delete a session."""
        key = request.match_info["key"]
        self.session_manager.delete(key)
        return web.json_response({"status": "deleted"})

    async def _handle_websocket(self, request: web.Request) -> web.WebSocketResponse:
        """Handle WebSocket connections for chat."""
        ws = web.WebSocketResponse()
        await ws.prepare(request)

        client_id = str(uuid.uuid4())
        self.websocket_clients[client_id] = ws
        default_session_id = f"web:{client_id}"

        try:
            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    try:
                        data = json.loads(msg.data)
                        await self._handle_ws_message(ws, data, default_session_id)
                    except json.JSONDecodeError:
                        await ws.send_json({"type": "error", "error": "Invalid JSON"})
                elif msg.type == aiohttp.WSMsgType.ERROR:
                    print(f"WebSocket error: {ws.exception()}")
        finally:
            del self.websocket_clients[client_id]

        return ws

    async def _handle_ws_message(
        self, ws: web.WebSocketResponse, data: dict[str, Any], default_session_id: str
    ) -> None:
        """Handle incoming WebSocket message."""
        msg_type = data.get("type")

        if msg_type == "chat":
            content = data.get("content", "")
            if not content:
                return

            frontend_session_id = data.get("session_id", "")
            if frontend_session_id:
                session_id = frontend_session_id
            else:
                session_id = default_session_id

            message_id = str(uuid.uuid4())

            await ws.send_json({
                "type": "stream_start",
                "id": message_id,
                "session_id": session_id,
            })

            try:
                response = await self.agent.process_direct(
                    content,
                    session_key=session_id,
                    channel="web",
                    chat_id=session_id,
                )

                await ws.send_json({
                    "type": "stream_end",
                    "id": message_id,
                    "content": response or "",
                    "session_id": session_id,
                })
            except Exception as e:
                await ws.send_json({
                    "type": "error",
                    "message_id": message_id,
                    "error": str(e),
                    "session_id": session_id,
                })

        elif msg_type == "ping":
            await ws.send_json({"type": "pong"})

    def run(self, host: str = "0.0.0.0", port: int = 18790) -> None:
        """Run the web gateway server."""
        web.run_app(self.app, host=host, port=port)


async def run_web_gateway(
    agent: AgentLoop,
    bus: MessageBus,
    config: Config,
    session_manager: SessionManager,
    host: str = "0.0.0.0",
    port: int = 18790,
    channel_manager: "ChannelManager | None" = None,
) -> None:
    """Run the web gateway as an async task."""
    gateway = WebGateway(
        agent=agent,
        bus=bus,
        config=config,
        session_manager=session_manager,
        channel_manager=channel_manager,
    )

    runner = web.AppRunner(gateway.app)
    await runner.setup()
    site = web.TCPSite(runner, host, port)
    await site.start()

    gateway._outbound_task = asyncio.create_task(gateway._start_outbound_listener())

    print(f"Web gateway running on http://{host}:{port}")

    try:
        while True:
            await asyncio.sleep(3600)
    finally:
        if gateway._outbound_task:
            gateway._outbound_task.cancel()
        if gateway._outbound_queue:
            bus.unsubscribe_outbound(gateway._outbound_queue)
        await runner.cleanup()
