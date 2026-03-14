import { createDefaultDiscoverer } from '../../factories';

export async function executeDiscover(args: string[]): Promise<void> {
  if (args.length === 0) {
    console.error('Error: missing topic for discover');
    process.exit(1);
  }

  const topic = args[0];
  let maxResults = 4;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--max-results') {
      maxResults = parseInt(args[++i], 10);
    }
  }

  process.stderr.write(`Discovering sources for: ${topic}\n`);

  const discoverer = await createDefaultDiscoverer();
  const results = await discoverer.discover(topic, maxResults);

  if (results.length === 0) {
    console.error('No official sources found.');
    process.exit(1);
  }

  console.log(JSON.stringify(results, null, 2));
}
