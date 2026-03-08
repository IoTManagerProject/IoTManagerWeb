import App from './App.svelte';

console.log("[layout] IoTManagerWeb loaded — layout debug logs enabled");

const app = new App({
	target: document.body,
	props: {}
});

export default app;