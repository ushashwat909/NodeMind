import { logger } from '../lib/logger.js'

/**
 * Service for communicating with GitHub / VCS API
 */
export class GitHubService {
  /**
   * Fetches metadata for a repository (e.g. "facebook/react" or "owner/repo")
   * @param {string} fullName - "owner/repo"
   * @param {string} [token] - Optional GitHub OAuth token
   */
  async getRepositoryMetadata(fullName, token = null) {
    try {
      const headers = {
        'User-Agent': 'CodeReviewAgent-Engine/1.0',
        Accept: 'application/vnd.github.v3+json',
      }
      if (token) {
        headers.Authorization = `token ${token}`
      }

      const response = await fetch(`https://api.github.com/repos/${fullName}`, { headers })

      if (response.ok) {
        const data = await response.json()
        return {
          repoIdentifier: `github:${data.id}`,
          name: data.name,
          fullName: data.full_name,
          cloneUrl: data.clone_url,
          htmlUrl: data.html_url,
          defaultBranch: data.default_branch || 'main',
          isPrivate: data.private || false,
          language: data.language || 'JavaScript',
          description: data.description || '',
          starsCount: data.stargazers_count || 0,
          forksCount: data.forks_count || 0,
        }
      }

      logger.warn(`GitHub API returned ${response.status} for ${fullName}. Falling back to default metadata.`)
    } catch (err) {
      logger.warn(`Failed to connect to GitHub API (${err.message}). Using simulated metadata.`)
    }

    // Default metadata fallback when rate limited or offline
    const parts = fullName.split('/')
    const name = parts[parts.length - 1] || 'repository'
    return {
      repoIdentifier: `github:${Buffer.from(fullName).toString('hex').slice(0, 10)}`,
      name,
      fullName,
      cloneUrl: `https://github.com/${fullName}.git`,
      htmlUrl: `https://github.com/${fullName}`,
      defaultBranch: 'main',
      isPrivate: false,
      language: 'TypeScript',
      description: 'Connected Git repository for autonomous code review',
      starsCount: 0,
      forksCount: 0,
    }
  }

  /**
   * Fetches the list of files in a repository branch
   * @param {string} fullName
   * @param {string} [branch='main']
   */
  async getRepositoryFiles(fullName, branch = 'main') {
    // In production, would call git clone or GitHub git/trees API.
    // For local evaluation, returns standard project source code files to review.
    return [
      {
        path: 'src/auth/jwt_validator.ts',
        language: 'typescript',
        content: `import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export class TokenValidator {
  private secretKey: string;

  constructor() {
    this.secretKey = process.env.JWT_SECRET || 'fallback_insecure_jwt_secret_key_12345';
  }

  public verifyToken(token: string) {
    // SECURITY RISK: decode without verifying signature algorithm
    const payload = jwt.decode(token);
    return payload;
  }

  public hashPasswordSync(password: string): string {
    // PERFORMANCE RISK: synchronous bcrypt blocks event loop
    return bcrypt.hashSync(password, 12);
  }

  public runQuery(userInput: string, db: any) {
    // SQL INJECTION RISK: raw string concatenation
    const query = "SELECT * FROM users WHERE username = '" + userInput + "'";
    return db.raw(query);
  }
}`,
      },
      {
        path: 'src/routes/api.ts',
        language: 'typescript',
        content: `import express from 'express';
const router = express.Router();

// Missing rate limiting on sensitive route
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  res.json({ status: 'authenticated' });
});

export default router;`,
      },
    ]
  }
}

export const githubService = new GitHubService()
