// PM2 production config for enchiweb (Enchi College of Education website + CMS).
//
// First time, on your machine (needs SSH access to the server):
//   pm2 deploy ecosystem.config.cjs production setup     # clones the repo on the server
//   scp apps/web/.env.production enchiweb@SERVER:/var/www/html/enchiweb/shared/.env
//   pm2 deploy ecosystem.config.cjs production           # build + start
//
// Every release after that:
//   pm2 deploy ecosystem.config.cjs production
//
// On the server:
//   pm2 status | pm2 logs enchiweb | pm2 reload enchiweb --update-env
//   pm2 startup && pm2 save                               # start on boot (once)
//   pm2 install pm2-logrotate                             # keep logs bounded (once)
//
// Works with either server layout:
//   a) `pm2 deploy` (below):  /var/www/html/enchiweb/current = the release,
//                              /var/www/html/enchiweb/shared  = .env, image-cache/, logs/
//   b) a plain `git clone` at /var/www/html/enchiweb: start it there with
//      `pm2 start ecosystem.config.cjs`; image-cache/ and logs/ go in .shared/
//      (gitignored) and .env stays in apps/web/.env.
const fs = require("node:fs");
const path = require("node:path");
const { parseEnv } = require("node:util");

const ROOT = "/var/www/html/enchiweb";
const APP_DIR = path.join(__dirname, "apps/web");
// pm2 deploy checks the repo out to <ROOT>/source and links <ROOT>/current to it.
const IS_RELEASE = ["current", "source"].includes(path.basename(__dirname));
const SHARED = IS_RELEASE ? path.join(__dirname, "..", "shared") : path.join(__dirname, ".shared");

// PM2 won't start the app if its log folder is missing.
for (const dir of [`${SHARED}/logs`, `${SHARED}/image-cache`]) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    // Not on the server (or no permission) — PM2 reports it if it matters.
  }
}

// Nitro's production server doesn't read .env itself, so load it here. This
// works the same in fork and cluster mode. After editing .env on the server,
// run `pm2 reload enchiweb --update-env`.
function readEnv(file) {
  try {
    return parseEnv(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

module.exports = {
  apps: [
    {
      name: "enchiweb",
      cwd: APP_DIR,
      script: ".output/server/index.mjs",

      // Two workers share port 3000: `pm2 reload` restarts them one at a time,
      // so deploys have no downtime. Raise this on a bigger server.
      exec_mode: "cluster",
      instances: 2,

      env: {
        ...readEnv(path.join(APP_DIR, ".env")),
        NODE_ENV: "production",
        HOST: "127.0.0.1", // nginx (or another proxy) faces the internet
        PORT: "3000",
        // Outside the release folder, so cached images survive every deploy.
        IMAGE_CACHE_DIR: `${SHARED}/image-cache`,
        // Images encoded at once, per worker (2 workers × 2 = 4 cores busy at most).
        IMAGE_CONCURRENCY: "2",
      },

      // Each worker holds a 64 MB in-memory image cache plus sharp's buffers.
      max_memory_restart: "1G",
      kill_timeout: 10_000, // let in-flight requests (image encodes) finish
      listen_timeout: 15_000,
      exp_backoff_restart_delay: 200, // back off instead of crash-looping (e.g. DB down)
      max_restarts: 20,

      out_file: `${SHARED}/logs/enchiweb.out.log`,
      error_file: `${SHARED}/logs/enchiweb.error.log`,
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      time: false,
    },
  ],

  deploy: {
    production: {
      user: "enchiweb", // the account the app runs as; it owns /var/www/html/enchiweb
      host: ["YOUR_SERVER_IP"],
      ref: "origin/master",
      repo: "https://github.com/dexitional/enchiweb.git", // use git@github.com:… if the repo is private
      path: ROOT,
      ssh_options: "StrictHostKeyChecking=accept-new",

      "pre-setup": `mkdir -p ${ROOT}/shared/image-cache ${ROOT}/shared/logs`,

      // Runs in /var/www/html/enchiweb/current after each pull.
      "post-deploy": [
        `ln -sfn ${ROOT}/shared/.env apps/web/.env`,
        "npm ci --include=dev", // the build needs Vite and the other devDependencies
        // Load .env for the build (VITE_* values are baked in) and migrations.
        `set -a && . ${ROOT}/shared/.env && set +a`,
        "npm run build",
        "npm run db:migrate",
        "pm2 reload ecosystem.config.cjs --update-env",
        "pm2 save",
      ].join(" && "),
    },
  },
};
