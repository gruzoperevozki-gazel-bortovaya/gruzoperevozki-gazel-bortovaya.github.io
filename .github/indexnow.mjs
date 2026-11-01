/**
 * Отправка URL из sitemap.xml в Bing и Yandex через IndexNow.
 * Ключ публичный: он лежит в корне сайта как /<key>.txt
 */
import fs from 'node:fs';

const KEY = '6ab0a899e0af4df681b50f90e25226ba';
const ENGINES = {
	Bing: 'https://www.bing.com/indexnow',
	Yandex: 'https://yandex.com/indexnow'
};

const xml = fs.readFileSync('sitemap.xml', 'utf8');
const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
if (urls.length === 0) {
	console.error('sitemap.xml: не найдено ни одного <loc>');
	process.exit(1);
}

const host = new URL(urls[0]).host;
const keyLocation = `https://${host}/${KEY}.txt`;
console.log(`Отправляю ${urls.length} URL на ${host}`);
urls.forEach((u) => console.log(`  • ${u}`));

const results = await Promise.all(
	Object.entries(ENGINES).map(async ([name, endpoint]) => {
		const res = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json; charset=utf-8' },
			body: JSON.stringify({ host, key: KEY, keyLocation, urlList: urls })
		});
		const text = (await res.text()).trim();
		const ok = res.status === 200 || res.status === 202;
		console.log(`${name}: HTTP ${res.status}${text ? ` ${text}` : ''}`);
		return ok;
	})
);

if (!results.every(Boolean)) process.exit(1);
