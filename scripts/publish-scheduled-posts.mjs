import fs from 'node:fs';
import path from 'node:path';

const postsPath = path.resolve('content/posts.json');
const now = process.env.UNTOZ_SCHEDULER_NOW ? new Date(process.env.UNTOZ_SCHEDULER_NOW) : new Date();

if (Number.isNaN(now.getTime())) {
  throw new Error('UNTOZ_SCHEDULER_NOW is not a valid date.');
}

if (!fs.existsSync(postsPath)) {
  throw new Error(`Missing ${postsPath}`);
}

const raw = fs.readFileSync(postsPath, 'utf8');
const posts = JSON.parse(raw);

if (!Array.isArray(posts)) {
  throw new Error('content/posts.json must contain an array.');
}

const published = [];
const invalid = [];

for (const post of posts) {
  if (post?.status !== 'Scheduled') continue;

  const scheduledAt = new Date(post.scheduled_at || '');
  if (Number.isNaN(scheduledAt.getTime())) {
    invalid.push(post.slug || post.title || 'untitled-post');
    continue;
  }

  if (scheduledAt.getTime() > now.getTime()) continue;

  post.status = 'Published';
  post.published_at = post.published_at || post.scheduled_at || now.toISOString();
  post.updated_at = now.toISOString();
  if (!post.date) post.date = scheduledAt.toISOString().slice(0, 10);
  published.push(post.slug || post.title || 'untitled-post');
}

if (invalid.length) {
  console.warn(`Scheduled posts with invalid dates: ${invalid.join(', ')}`);
}

const changed = published.length > 0;

if (changed) {
  fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2) + '\n');
  console.log(`Published ${published.length} scheduled post(s): ${published.join(', ')}`);
} else {
  console.log('No scheduled posts are due.');
}

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `count=${published.length}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `posts=${published.join(',')}\n`);
}
