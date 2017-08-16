## Synopsis

Monitors file changes for one or more sites on a server, and auto-purges the corresponding file within the Cloudflare cache.

## Setup

Use config.json.sample as a guide to create your own config.json file. Config object must contain your Cloudflare email, Cloudflare key, and an array of sites (minimum of one), that contains the directory to monitor, the root URL of the website, and the Cloudflare zone ID (obtained in the Cloudflare portal).