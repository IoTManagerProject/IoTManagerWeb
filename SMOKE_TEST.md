# Smoke test checklist (cleanup-and-verify)

Run `npm run dev`, open http://localhost:8080 (or configured port).

- [ ] App loads (no white screen); hash router works.
- [ ] Dashboard (`/#/`): layout loads when device(s) connected; no NaN in charts.
- [ ] List (`/#/list`): device list, add device, save list.
- [ ] Config (`/#/config`): load configs from portal; export/import file (mark iotm, scenario=>).
- [ ] Connection (`/#/connection`): SSID, settings, MQTT.
- [ ] System (`/#/system`): versions list (ver.json), reboot.
- [ ] Profile (`/#/profile`): user profile, compiler, install build (link uses portal.BASE).
- [ ] Login (`/#/login`): login flow (CORS may block from localhost; deploy or proxy to verify).
- [ ] Dropdown: switch device; selected device data updates.
- [ ] Portal links: Config "publish" opens portal configs with token; Profile "install" uses portal build URL.

Build: `npm run build` — must complete without errors.
