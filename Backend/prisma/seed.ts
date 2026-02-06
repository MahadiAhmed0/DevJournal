import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/en';

const prisma = new PrismaClient();

const TAG_NAMES = [
  'nestjs',
  'typescript',
  'react',
  'prisma',
  'postgres',
  'jwt',
  'docker',
  'ai',
  'supabase',
  'backend',
];

const LANGUAGES = ['typescript', 'javascript', 'python', 'java', 'sql'];

const AVATAR_PROVIDERS = [
  (seed: string) => `https://i.pravatar.cc/150?u=${seed}`,
  (seed: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
  (seed: string) => `https://api.dicebear.com/7.x/personas/svg?seed=${seed}`,
  (seed: string) => `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}`,
  (seed: string) => `https://robohash.org/${seed}?set=set4&size=150x150`,
];

const CODE_SAMPLES: Record<string, string[]> = {
  typescript: [
    `interface User {
  id: string;
  email: string;
  name: string;
}

async function getUser(id: string): Promise<User> {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json();
}`,
    `type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

function tryCatch<T>(fn: () => T): Result<T> {
  try {
    return { success: true, data: fn() };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}`,
    `import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}`,
    `const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};`,
    `class EventEmitter<T extends Record<string, any>> {
  private listeners: Map<keyof T, Set<Function>> = new Map();

  on<K extends keyof T>(event: K, callback: (data: T[K]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  emit<K extends keyof T>(event: K, data: T[K]) {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }
}`,
  ],
  javascript: [
    `const fetchWithRetry = async (url, options = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
};`,
    `const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

const compose = (...fns) => (x) => fns.reduceRight((v, f) => f(v), x);

const double = x => x * 2;
const addOne = x => x + 1;

const result = pipe(double, addOne)(5); // 11`,
    `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) this.cache.delete(key);
    else if (this.cache.size >= this.capacity) {
      this.cache.delete(this.cache.keys().next().value);
    }
    this.cache.set(key, value);
  }
}`,
    `const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, deepClone(v)])
  );
};`,
    `const throttle = (fn, limit) => {
  let inThrottle = false;
  return (...args) => {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};`,
  ],
  python: [
    `from dataclasses import dataclass
from typing import Optional, List

@dataclass
class User:
    id: str
    email: str
    name: str
    bio: Optional[str] = None

def get_users() -> List[User]:
    return [
        User(id="1", email="john@example.com", name="John"),
        User(id="2", email="jane@example.com", name="Jane"),
    ]`,
    `import asyncio
from functools import wraps

def async_retry(retries=3, delay=1):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == retries - 1:
                        raise
                    await asyncio.sleep(delay * (2 ** attempt))
        return wrapper
    return decorator`,
    `from contextlib import contextmanager
import time

@contextmanager
def timer(label: str):
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - start
        print(f"{label}: {elapsed:.4f}s")

with timer("Processing"):
    result = sum(range(1_000_000))`,
    `class Singleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, 'initialized'):
            self.initialized = True
            self.data = {}`,
    `from functools import lru_cache

@lru_cache(maxsize=1000)
def fibonacci(n: int) -> int:
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# First 20 fibonacci numbers
fibs = [fibonacci(i) for i in range(20)]`,
  ],
  java: [
    `public class Singleton {
    private static volatile Singleton instance;
    private Singleton() {}

    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}`,
    `import java.util.*;
import java.util.stream.*;

public class StreamExample {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        
        int sum = numbers.stream()
            .filter(n -> n % 2 == 0)
            .map(n -> n * n)
            .reduce(0, Integer::sum);
        
        System.out.println("Sum of squares of even numbers: " + sum);
    }
}`,
    `@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;

    @GetMapping
    public List<User> getAllUsers() {
        return userService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        return userService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}`,
    `public record User(
    String id,
    String email,
    String name,
    Optional<String> bio
) {
    public User {
        Objects.requireNonNull(id);
        Objects.requireNonNull(email);
        Objects.requireNonNull(name);
    }
}`,
    `import java.util.concurrent.*;

public class AsyncExample {
    private final ExecutorService executor = Executors.newFixedThreadPool(4);

    public CompletableFuture<String> fetchDataAsync(String url) {
        return CompletableFuture.supplyAsync(() -> {
            // Simulate API call
            try { Thread.sleep(1000); } catch (InterruptedException e) {}
            return "Data from " + url;
        }, executor);
    }
}`,
  ],
  sql: [
    `-- Get users with their entry counts
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(e.id) AS entry_count,
    MAX(e.created_at) AS last_entry_date
FROM users u
LEFT JOIN entries e ON u.id = e.user_id
GROUP BY u.id, u.name, u.email
HAVING COUNT(e.id) > 5
ORDER BY entry_count DESC;`,
    `-- Create a materialized view for dashboard stats
CREATE MATERIALIZED VIEW user_stats AS
SELECT 
    u.id AS user_id,
    COUNT(DISTINCT e.id) AS total_entries,
    COUNT(DISTINCT s.id) AS total_snippets,
    COUNT(DISTINCT t.id) AS unique_tags,
    COALESCE(SUM(CASE WHEN e.is_public THEN 1 ELSE 0 END), 0) AS public_entries
FROM users u
LEFT JOIN entries e ON u.id = e.user_id
LEFT JOIN code_snippets s ON u.id = s.user_id
LEFT JOIN entries_tags et ON e.id = et.entry_id
LEFT JOIN tags t ON et.tag_id = t.id
GROUP BY u.id;`,
    `-- Full-text search on entries
CREATE INDEX entries_search_idx ON entries 
USING GIN (to_tsvector('english', title || ' ' || content));

SELECT id, title, 
    ts_rank(to_tsvector('english', title || ' ' || content), 
            plainto_tsquery('english', 'typescript react')) AS rank
FROM entries
WHERE to_tsvector('english', title || ' ' || content) 
    @@ plainto_tsquery('english', 'typescript react')
ORDER BY rank DESC
LIMIT 10;`,
    `-- Recursive CTE for nested categories
WITH RECURSIVE category_tree AS (
    SELECT id, name, parent_id, 1 AS level
    FROM categories
    WHERE parent_id IS NULL
    
    UNION ALL
    
    SELECT c.id, c.name, c.parent_id, ct.level + 1
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree ORDER BY level, name;`,
    `-- Window functions for analytics
SELECT 
    date_trunc('day', created_at) AS day,
    COUNT(*) AS daily_entries,
    SUM(COUNT(*)) OVER (ORDER BY date_trunc('day', created_at)) AS cumulative_entries,
    AVG(COUNT(*)) OVER (
        ORDER BY date_trunc('day', created_at) 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS rolling_7day_avg
FROM entries
GROUP BY date_trunc('day', created_at)
ORDER BY day;`,
  ],
};

const MARKDOWN_TEMPLATES = [
  `# {{title}}

## Overview
{{intro}}

## Key Concepts

### Understanding the Basics
{{paragraph}}

### Implementation Details
{{paragraph}}

\`\`\`{{lang}}
{{code}}
\`\`\`

## Best Practices
- {{tip1}}
- {{tip2}}
- {{tip3}}

## Conclusion
{{conclusion}}`,

  `# {{title}}

{{intro}}

## The Problem
{{paragraph}}

## The Solution

Here's how we can solve this:

\`\`\`{{lang}}
{{code}}
\`\`\`

### Breaking it Down
1. {{step1}}
2. {{step2}}
3. {{step3}}

## Key Takeaways
> {{quote}}

{{conclusion}}`,

  `# {{title}}

## TL;DR
{{summary}}

## Background
{{paragraph}}

## Implementation

\`\`\`{{lang}}
{{code}}
\`\`\`

## How it Works
{{explanation}}

### Performance Considerations
- {{perf1}}
- {{perf2}}

## Further Reading
- [Documentation](https://example.com)
- [Related Article](https://example.com)`,

  `# {{title}}

Today I learned about {{topic}}.

## What I Discovered
{{paragraph}}

## Code Example

\`\`\`{{lang}}
{{code}}
\`\`\`

## Why This Matters
{{paragraph}}

## Notes
- {{note1}}
- {{note2}}
- {{note3}}

## Resources
Check out the official docs for more info.`,

  `# {{title}}

## Quick Reference

### Setup
\`\`\`bash
npm install {{package}}
\`\`\`

### Usage

\`\`\`{{lang}}
{{code}}
\`\`\`

## Configuration Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| {{opt1}} | string | null | {{desc1}} |
| {{opt2}} | boolean | false | {{desc2}} |

## Common Patterns
{{paragraph}}

## Troubleshooting
If you encounter issues, try:
1. {{fix1}}
2. {{fix2}}`,
];

const AI_SUMMARY_TEMPLATES = [
  'This entry covers {{topic}} with practical examples and implementation details. Key concepts include {{concept1}} and {{concept2}}.',
  'A deep dive into {{topic}}, exploring best practices and common patterns. The author demonstrates {{concept1}} with {{lang}} code.',
  'Comprehensive guide on {{topic}}. Highlights include {{concept1}}, {{concept2}}, and practical {{lang}} examples.',
  'Technical overview of {{topic}} featuring working {{lang}} code. Main takeaways: {{concept1}} and {{concept2}}.',
  'This journal entry explores {{topic}} through hands-on examples. Focus areas: {{concept1}}, {{concept2}}, and performance tips.',
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomElements<T>(arr: T[], min: number, max: number): T[] {
  const count = faker.number.int({ min, max });
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateMarkdownContent(lang: string): string {
  const template = getRandomElement(MARKDOWN_TEMPLATES);
  const code = getRandomElement(CODE_SAMPLES[lang] || CODE_SAMPLES.typescript);

  return template
    .replace(/{{title}}/g, faker.lorem.sentence({ min: 3, max: 8 }))
    .replace(/{{intro}}/g, faker.lorem.paragraph())
    .replace(/{{paragraph}}/g, faker.lorem.paragraphs(2))
    .replace(/{{lang}}/g, lang)
    .replace(/{{code}}/g, code)
    .replace(/{{tip1}}/g, faker.lorem.sentence())
    .replace(/{{tip2}}/g, faker.lorem.sentence())
    .replace(/{{tip3}}/g, faker.lorem.sentence())
    .replace(/{{step1}}/g, faker.lorem.sentence())
    .replace(/{{step2}}/g, faker.lorem.sentence())
    .replace(/{{step3}}/g, faker.lorem.sentence())
    .replace(/{{conclusion}}/g, faker.lorem.paragraph())
    .replace(/{{summary}}/g, faker.lorem.sentence())
    .replace(/{{explanation}}/g, faker.lorem.paragraph())
    .replace(/{{perf1}}/g, faker.lorem.sentence())
    .replace(/{{perf2}}/g, faker.lorem.sentence())
    .replace(/{{topic}}/g, faker.hacker.noun())
    .replace(/{{note1}}/g, faker.lorem.sentence())
    .replace(/{{note2}}/g, faker.lorem.sentence())
    .replace(/{{note3}}/g, faker.lorem.sentence())
    .replace(/{{package}}/g, faker.helpers.slugify(faker.lorem.word()))
    .replace(/{{opt1}}/g, faker.lorem.word())
    .replace(/{{opt2}}/g, faker.lorem.word())
    .replace(/{{desc1}}/g, faker.lorem.sentence({ min: 3, max: 6 }))
    .replace(/{{desc2}}/g, faker.lorem.sentence({ min: 3, max: 6 }))
    .replace(/{{fix1}}/g, faker.lorem.sentence())
    .replace(/{{fix2}}/g, faker.lorem.sentence())
    .replace(/{{quote}}/g, faker.lorem.sentence());
}

function generateAISummary(tags: string[], lang: string): string {
  const template = getRandomElement(AI_SUMMARY_TEMPLATES);
  return template
    .replace(/{{topic}}/g, tags[0] || 'development')
    .replace(/{{concept1}}/g, tags[1] || faker.hacker.noun())
    .replace(/{{concept2}}/g, tags[2] || faker.hacker.verb())
    .replace(/{{lang}}/g, lang);
}

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');
  await prisma.codeSnippet.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Database cleared');
}

async function createTags() {
  console.log('🏷️  Creating tags...');
  const tags = await prisma.tag.createManyAndReturn({
    data: TAG_NAMES.map((name) => ({ name })),
  });
  console.log(`✅ Created ${tags.length} tags`);
  return tags;
}

async function createUsers(count: number) {
  console.log(`👤 Creating ${count} users...`);
  const usedUsernames = new Set<string>();
  const users = [];

  for (let i = 0; i < count; i++) {
    let username: string;
    do {
      username = faker.internet
        .username()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_');
    } while (usedUsernames.has(username));
    usedUsernames.add(username);

    const user = await prisma.user.create({
      data: {
        email: faker.internet.email().toLowerCase(),
        name: faker.person.fullName(),
        username,
        avatar: getRandomElement(AVATAR_PROVIDERS)(username),
        bio: faker.person.bio(),
        githubUrl: `https://github.com/${username}`,
        linkedinUrl: `https://linkedin.com/in/${username}`,
        createdAt: faker.date.past({ years: 2 }),
      },
    });
    users.push(user);

    if ((i + 1) % 20 === 0) {
      console.log(`   Created ${i + 1}/${count} users...`);
    }
  }

  console.log(`✅ Created ${users.length} users`);
  return users;
}

async function createEntriesAndSnippets(
  users: Awaited<ReturnType<typeof createUsers>>,
  tags: Awaited<ReturnType<typeof createTags>>,
) {
  console.log('📝 Creating entries and snippets...');
  let totalEntries = 0;
  let totalSnippets = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const entryCount = faker.number.int({ min: 5, max: 10 });
    const snippetCount = faker.number.int({ min: 3, max: 7 });
    const userEntries = [];

    // Create entries for this user
    for (let j = 0; j < entryCount; j++) {
      const lang = getRandomElement(LANGUAGES);
      const entryTags = getRandomElements(tags, 1, 4);
      const isPublic = Math.random() < 0.7; // 70% public
      const hasSummary = Math.random() < 0.3; // 30% have AI summary

      const entry = await prisma.entry.create({
        data: {
          title: faker.lorem.sentence({ min: 4, max: 10 }),
          content: generateMarkdownContent(lang),
          summary: hasSummary
            ? generateAISummary(
                entryTags.map((t) => t.name),
                lang,
              )
            : null,
          isPublic,
          userId: user.id,
          createdAt: faker.date.between({
            from: user.createdAt,
            to: new Date(),
          }),
          tags: {
            connect: entryTags.map((t) => ({ id: t.id })),
          },
        },
      });
      userEntries.push(entry);
      totalEntries++;
    }

    // Create snippets for this user
    for (let k = 0; k < snippetCount; k++) {
      const lang = getRandomElement(LANGUAGES);
      const code = getRandomElement(CODE_SAMPLES[lang]);
      const isPublic = Math.random() < 0.5; // 50% public
      const linkToEntry = Math.random() < 0.4; // 40% linked to an entry

      await prisma.codeSnippet.create({
        data: {
          title: faker.lorem.sentence({ min: 2, max: 5 }),
          code,
          language: lang,
          description: faker.lorem.sentence(),
          isPublic,
          userId: user.id,
          entryId: linkToEntry ? getRandomElement(userEntries).id : null,
          createdAt: faker.date.between({
            from: user.createdAt,
            to: new Date(),
          }),
        },
      });
      totalSnippets++;
    }

    if ((i + 1) % 20 === 0) {
      console.log(`   Processed ${i + 1}/${users.length} users...`);
    }
  }

  console.log(`✅ Created ${totalEntries} entries and ${totalSnippets} snippets`);
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    await clearDatabase();
    const tags = await createTags();
    const users = await createUsers(100);
    await createEntriesAndSnippets(users, tags);

    // Print summary
    const stats = await prisma.$transaction([
      prisma.user.count(),
      prisma.entry.count(),
      prisma.codeSnippet.count(),
      prisma.tag.count(),
    ]);

    console.log('\n📊 Final Statistics:');
    console.log(`   Users: ${stats[0]}`);
    console.log(`   Entries: ${stats[1]}`);
    console.log(`   Snippets: ${stats[2]}`);
    console.log(`   Tags: ${stats[3]}`);
    console.log('\n✨ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
